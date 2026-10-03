using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Scootr.Data.DTOs.Auth;
using Scootr.Data.Services.Authentication;
using Scootr.Data.Services.Firebase;
using Scootr.Data.Services.Users;
using System;
using System.Threading.Tasks;

namespace ScootrApi.Controllers
{
    /// <summary>
    /// Controller for Firebase-based authentication operations.
    /// Sign-in/Sign-out using Firebase ID tokens.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class FirebaseAuthController : ControllerBase
    {
        private readonly IFirebaseUserManagementService _firebaseService;
        private readonly IUserService _userService;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<FirebaseAuthController> _logger;

        public FirebaseAuthController(
            IFirebaseUserManagementService firebaseService,
            IUserService userService,
            ICurrentUserService currentUserService,
            ILogger<FirebaseAuthController> logger)
        {
            _firebaseService = firebaseService;
            _userService = userService;
            _currentUserService = currentUserService;
            _logger = logger;
        }

        /// <summary>
        /// Sign in with Firebase ID token.
        /// Client authenticates with Firebase (email/password, Google, etc.) and sends the ID token.
        /// Server verifies the token and returns the token with user information.
        /// </summary>
        [HttpPost("signin")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(AuthResponseDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> SignIn([FromBody] FirebaseSignInDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (string.IsNullOrWhiteSpace(dto.IdToken))
                return BadRequest(new { message = "ID token is required" });

            try
            {
                // Verify Firebase ID token
                var tokenInfo = await _firebaseService.VerifyIdTokenAsync(dto.IdToken, checkRevoked: true);

                if (tokenInfo == null || string.IsNullOrWhiteSpace(tokenInfo.Uid))
                {
                    return Unauthorized(new { message = "Invalid authentication token" });
                }

                // Find Scootr user by Firebase UID
                var user = await _userService.GetByFirebaseUidAsync(tokenInfo.Uid);

                if (user == null)
                {
                    _logger.LogWarning(
                        "Sign-in failed: Firebase user not found in Scootr database. Firebase UID: {Uid}",
                        tokenInfo.Uid);

                    return Unauthorized(new { message = "User not found in system. Please contact administrator." });
                }

                if (!user.IsActive)
                {
                    _logger.LogWarning(
                        "Sign-in failed: User account is inactive. User ID: {UserId}, Firebase UID: {Uid}",
                        user.Id,
                        tokenInfo.Uid);

                    return Unauthorized(new { message = "User account is not active" });
                }

                _logger.LogInformation(
                    "User signed in successfully. User ID: {UserId}, Firebase UID: {Uid}",
                    user.Id,
                    tokenInfo.Uid);

                // Return the token back to client (it's already valid)
                // Client will use this token for subsequent API calls
                return Ok(new AuthResponseDto
                {
                    Token = dto.IdToken,
                    TokenType = "Bearer",
                    ExpiresAt = DateTimeOffset.FromUnixTimeSeconds(tokenInfo.ExpirationTimestamp).UtcDateTime,
                    User = new UserInfo
                    {
                        Id = user.Id,
                        Name = user.Name,
                        Email = user.Email,
                        Username = user.Username,
                        Level = user.Level.ToString(),
                        FirebaseUid = user.UID
                    }
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Sign-in failed: Token verification error");
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during sign-in");
                return StatusCode(500, new { message = "An error occurred during sign-in" });
            }
        }

        /// <summary>
        /// Sign out the current user.
        /// Revokes all refresh tokens for the user's Firebase account.
        /// Client should also clear the ID token locally.
        /// </summary>
        [HttpPost("signout")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> SignOut()
        {
            var firebaseUid = _currentUserService.FirebaseUid;

            if (string.IsNullOrWhiteSpace(firebaseUid))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            try
            {
                // Revoke all refresh tokens for this user
                await _firebaseService.RevokeRefreshTokensAsync(firebaseUid);

                _logger.LogInformation(
                    "User signed out and tokens revoked. User ID: {UserId}, Firebase UID: {Uid}",
                    _currentUserService.UserId,
                    firebaseUid);

                return Ok(new
                {
                    message = "Signed out successfully. All refresh tokens have been revoked."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during sign-out for Firebase UID: {Uid}", firebaseUid);
                return StatusCode(500, new { message = "An error occurred during sign-out" });
            }
        }

        /// <summary>
        /// Verify the current Firebase ID token.
        /// Returns token information and user details.
        /// </summary>
        [HttpPost("verify")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> VerifyToken([FromBody] FirebaseSignInDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (string.IsNullOrWhiteSpace(dto.IdToken))
                return BadRequest(new { message = "ID token is required" });

            try
            {
                var tokenInfo = await _firebaseService.VerifyIdTokenAsync(dto.IdToken, checkRevoked: true);

                if (tokenInfo == null)
                    return Unauthorized(new { message = "Invalid token" });

                var user = await _userService.GetByFirebaseUidAsync(tokenInfo.Uid);

                return Ok(new
                {
                    valid = true,
                    token = new
                    {
                        uid = tokenInfo.Uid,
                        email = tokenInfo.Email,
                        emailVerified = tokenInfo.EmailVerified,
                        issuedAt = DateTimeOffset.FromUnixTimeSeconds(tokenInfo.IssuedAtTimestamp).UtcDateTime,
                        expirationTime = DateTimeOffset.FromUnixTimeSeconds(tokenInfo.ExpirationTimestamp).UtcDateTime
                    },
                    user = user != null ? new
                    {
                        id = user.Id,
                        name = user.Name,
                        email = user.Email,
                        username = user.Username,
                        level = user.Level.ToString(),
                        isActive = user.IsActive
                    } : null
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { valid = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying token");
                return StatusCode(500, new { message = "An error occurred during token verification" });
            }
        }

        /// <summary>
        /// Get current authenticated user information.
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> GetCurrentUser()
        {
            var user = await _currentUserService.GetCurrentUserAsync();

            if (user == null)
                return Unauthorized(new { message = "User not found" });

            return Ok(new
            {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                username = user.Username,
                phone = user.Phone,
                level = user.Level.ToString(),
                isActive = user.IsActive,
                firebaseUid = user.UID,
                createdAt = user.CreatedAt
            });
        }

        /// <summary>
        /// Health check endpoint for authentication service.
        /// </summary>
        [HttpGet("health")]
        [AllowAnonymous]
        [ProducesResponseType(200)]
        public IActionResult Health()
        {
            return Ok(new
            {
                status = "healthy",
                service = "Firebase Authentication",
                timestamp = DateTime.UtcNow
            });
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Scootr.Core.Domain.Users;
using Scootr.Data.DTOs.Users;
using Scootr.Data.Services.Authentication;
using Scootr.Data.Services.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ScootrApi.Controllers
{
    /// <summary>
    /// Controller for managing users with Firebase Authentication integration.
    /// All endpoints require Firebase ID token authentication.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(
            IUserService userService,
            ICurrentUserService currentUserService,
            ILogger<UsersController> logger)
        {
            _userService = userService;
            _currentUserService = currentUserService;
            _logger = logger;
        }

        /// <summary>
        /// Get current authenticated user information.
        /// </summary>
        [HttpGet("me")]
        [ProducesResponseType(typeof(UserResponseDto), 200)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> GetCurrentUser()
        {
            var user = await _currentUserService.GetCurrentUserAsync();
            if (user == null)
                return Unauthorized(new { message = "User not found" });

            return Ok(MapToResponseDto(user));
        }

        /// <summary>
        /// Get user by ID. Admin only.
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(UserResponseDto), 200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(403)]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(MapToResponseDto(user));
        }

        /// <summary>
        /// Get user by Firebase UID. Admin only.
        /// </summary>
        [HttpGet("firebase/{firebaseUid}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(UserResponseDto), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetByFirebaseUid(string firebaseUid)
        {
            var user = await _userService.GetByFirebaseUidAsync(firebaseUid);
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(MapToResponseDto(user));
        }

        /// <summary>
        /// Get user by email. Admin only.
        /// </summary>
        [HttpGet("email/{email}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(UserResponseDto), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetByEmail(string email)
        {
            var user = await _userService.GetByEmailAsync(email);
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(MapToResponseDto(user));
        }

        /// <summary>
        /// Get all users. Admin and Staff only.
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        [ProducesResponseType(typeof(IEnumerable<UserResponseDto>), 200)]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userService.GetAllAsync();
            return Ok(users.Select(MapToResponseDto));
        }

        /// <summary>
        /// Get paginated users with optional active status filter. Admin and Staff only.
        /// </summary>
        [HttpGet("paginated")]
        [Authorize(Roles = "Admin,Staff")]
        [ProducesResponseType(typeof(object), 200)]
        public async Task<IActionResult> GetPaginated(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] bool? isActive = null)
        {
            if (page < 1 || pageSize < 1 || pageSize > 100)
                return BadRequest(new { message = "Invalid pagination parameters" });

            var result = await _userService.GetPaginatedAsync(page, pageSize, isActive);

            return Ok(new
            {
                items = result.Items.Select(MapToResponseDto),
                totalCount = result.TotalCount,
                page = result.Page,
                pageSize = result.PageSize,
                totalPages = (int)Math.Ceiling(result.TotalCount / (double)result.PageSize)
            });
        }

        /// <summary>
        /// Create a new user with Firebase Authentication. Admin only.
        /// Firebase user is created first, then Scootr user.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(UserResponseDto), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(403)]
        public async Task<IActionResult> Create([FromBody] CreateUserWithFirebaseDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                // Parse user level
                if (!Enum.TryParse<UserLevel>(dto.Level, true, out var level))
                {
                    return BadRequest(new { message = $"Invalid user level: {dto.Level}" });
                }

                var user = await _userService.CreateUserWithFirebaseAsync(
                    name: dto.Name,
                    email: dto.Email,
                    username: dto.Username,
                    phone: dto.Phone,
                    password: null, // Password managed by Firebase
                    level: level,
                    isActive: dto.IsActive
                );

                _logger.LogInformation(
                    "User created by Admin. User ID: {UserId}, Email: {Email}, Created By: {AdminId}",
                    user.Id,
                    user.Email,
                    _currentUserService.UserId);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = user.Id },
                    MapToResponseDto(user));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user");
                return StatusCode(500, new { message = "An error occurred while creating the user" });
            }
        }

        /// <summary>
        /// Update an existing user. Admin can update any user. Users can update themselves (limited fields).
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(UserResponseDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserWithFirebaseDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var isAdmin = _currentUserService.IsAdmin;
            var isSelf = _currentUserService.UserId == id;

            // Only admin can update other users
            if (!isAdmin && !isSelf)
                return Forbid();

            try
            {
                var existingUser = await _userService.GetByIdAsync(id);
                if (existingUser == null)
                    return NotFound(new { message = "User not found" });

                // Parse user level if provided
                UserLevel? level = null;
                if (!string.IsNullOrWhiteSpace(dto.Level))
                {
                    if (!Enum.TryParse<UserLevel>(dto.Level, true, out var parsedLevel))
                    {
                        return BadRequest(new { message = $"Invalid user level: {dto.Level}" });
                    }
                    level = parsedLevel;

                    // Only admin can change user level
                    if (!isAdmin && level.HasValue && level.Value != existingUser.Level)
                    {
                        return Forbid();
                    }
                }

                // Only admin can change IsActive status
                bool? isActive = dto.IsActive;
                if (!isAdmin && isActive.HasValue && isActive.Value != existingUser.IsActive)
                {
                    return Forbid();
                }

                var success = await _userService.UpdateUserAsync(
                    id: id,
                    name: dto.Name,
                    email: dto.Email,
                    username: dto.Username,
                    phone: dto.Phone,
                    level: level,
                    isActive: isActive
                );

                if (!success)
                    return NotFound(new { message = "User not found" });

                var updatedUser = await _userService.GetByIdAsync(id);

                _logger.LogInformation(
                    "User updated. User ID: {UserId}, Updated By: {UpdaterId}",
                    id,
                    _currentUserService.UserId);

                return Ok(MapToResponseDto(updatedUser!));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user {UserId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the user" });
            }
        }

        /// <summary>
        /// Deactivate a user (soft delete). Admin only.
        /// Sets IsActive = false and disables Firebase account.
        /// </summary>
        [HttpPost("{id}/deactivate")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        [ProducesResponseType(403)]
        public async Task<IActionResult> Deactivate(int id)
        {
            // Prevent self-deactivation
            if (_currentUserService.UserId == id)
                return BadRequest(new { message = "Cannot deactivate your own account" });

            var success = await _userService.DeactivateUserAsync(id);
            if (!success)
                return NotFound(new { message = "User not found" });

            _logger.LogWarning(
                "User deactivated. User ID: {UserId}, Deactivated By: {AdminId}",
                id,
                _currentUserService.UserId);

            return NoContent();
        }

        /// <summary>
        /// Reactivate a previously deactivated user. Admin only.
        /// Sets IsActive = true and enables Firebase account.
        /// </summary>
        [HttpPost("{id}/reactivate")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        [ProducesResponseType(403)]
        public async Task<IActionResult> Reactivate(int id)
        {
            var success = await _userService.ReactivateUserAsync(id);
            if (!success)
                return NotFound(new { message = "User not found" });

            _logger.LogInformation(
                "User reactivated. User ID: {UserId}, Reactivated By: {AdminId}",
                id,
                _currentUserService.UserId);

            return NoContent();
        }

        /// <summary>
        /// Set or update the Firebase password for a user. Admin only.
        /// The user must have a Firebase account (UID).
        /// </summary>
        [HttpPost("{id}/set-password")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(204)]
        [ProducesResponseType(400)]
        [ProducesResponseType(404)]
        [ProducesResponseType(403)]
        public async Task<IActionResult> SetPassword(int id, [FromBody] SetPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var success = await _userService.SetFirebasePasswordAsync(id, dto.Password);
                if (!success)
                    return NotFound(new { message = "User not found" });

                _logger.LogInformation(
                    "User password updated. User ID: {UserId}, Updated By: {AdminId}",
                    id,
                    _currentUserService.UserId);

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting password for user {UserId}", id);
                return StatusCode(500, new { message = "An error occurred while setting the password" });
            }
        }

        /// <summary>
        /// Permanently delete a user (hard delete). Admin only.
        /// Deletes from both Scootr database and Firebase.
        /// WARNING: This action cannot be undone. Use deactivate instead.
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        [ProducesResponseType(403)]
        public async Task<IActionResult> Delete(int id)
        {
            // Prevent self-deletion
            if (_currentUserService.UserId == id)
                return BadRequest(new { message = "Cannot delete your own account" });

            var success = await _userService.DeleteUserAsync(id);
            if (!success)
                return NotFound(new { message = "User not found" });

            _logger.LogWarning(
                "User PERMANENTLY DELETED. User ID: {UserId}, Deleted By: {AdminId}",
                id,
                _currentUserService.UserId);

            return NoContent();
        }

        /// <summary>
        /// Check if email is available for registration.
        /// </summary>
        [HttpGet("check-email")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(object), 200)]
        public async Task<IActionResult> CheckEmailAvailability([FromQuery] string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "Email is required" });

            var exists = await _userService.EmailExistsAsync(email);
            return Ok(new { available = !exists, email });
        }

        /// <summary>
        /// Check if username is available for registration.
        /// </summary>
        [HttpGet("check-username")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(object), 200)]
        public async Task<IActionResult> CheckUsernameAvailability([FromQuery] string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return BadRequest(new { message = "Username is required" });

            var exists = await _userService.UsernameExistsAsync(username);
            return Ok(new { available = !exists, username });
        }

        private static UserResponseDto MapToResponseDto(User user)
        {
            return new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Username = user.Username,
                Email = user.Email,
                Phone = user.Phone,
                Level = user.Level.ToString(),
                IsActive = user.IsActive,
                FirebaseUid = user.UID,
                CreatedAt = user.CreatedAt
            };
        }
    }
}

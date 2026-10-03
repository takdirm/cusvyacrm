using FirebaseAdmin.Auth;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Scootr.Data.Services.Firebase
{
    /// <summary>
    /// Implementation of Firebase User Management Service using Firebase Admin SDK.
    /// </summary>
    public class FirebaseUserManagementService : IFirebaseUserManagementService
    {
        private readonly ILogger<FirebaseUserManagementService> _logger;

        public FirebaseUserManagementService(ILogger<FirebaseUserManagementService> logger)
        {
            _logger = logger;
        }

        public async Task<string> CreateFirebaseUserAsync(
            string email,
            string? password = null,
            string? displayName = null,
            string? phoneNumber = null,
            bool emailVerified = false)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email))
                    throw new ArgumentException("Email is required", nameof(email));

                var args = new UserRecordArgs
                {
                    Email = email,
                    EmailVerified = emailVerified,
                    DisplayName = displayName,
                    PhoneNumber = phoneNumber,
                    Disabled = false
                };

                if (!string.IsNullOrWhiteSpace(password))
                {
                    args.Password = password;
                }

                var userRecord = await FirebaseAuth.DefaultInstance.CreateUserAsync(args);

                _logger.LogInformation(
                    "Firebase user created successfully. UID: {Uid}, Email: {Email}",
                    userRecord.Uid,
                    userRecord.Email);

                return userRecord.Uid;
            }
            catch (FirebaseAuthException ex)
            {
                _logger.LogError(
                    ex,
                    "Firebase user creation failed. Email: {Email}, ErrorCode: {ErrorCode}",
                    email,
                    ex.AuthErrorCode);

                throw new InvalidOperationException(
                    $"Failed to create Firebase user: {GetUserFriendlyErrorMessage(ex)}",
                    ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating Firebase user. Email: {Email}", email);
                throw;
            }
        }

        public async Task UpdateFirebaseUserAsync(
            string firebaseUid,
            string? email = null,
            string? displayName = null,
            string? phoneNumber = null,
            bool? disabled = null,
            bool? emailVerified = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(firebaseUid))
                    throw new ArgumentException("Firebase UID is required", nameof(firebaseUid));

                var args = new UserRecordArgs { Uid = firebaseUid };

                if (!string.IsNullOrWhiteSpace(email))
                    args.Email = email;

                if (displayName != null)
                    args.DisplayName = displayName;

                if (phoneNumber != null)
                    args.PhoneNumber = phoneNumber;

                if (disabled.HasValue)
                    args.Disabled = disabled.Value;

                if (emailVerified.HasValue)
                    args.EmailVerified = emailVerified.Value;

                await FirebaseAuth.DefaultInstance.UpdateUserAsync(args);

                _logger.LogInformation(
                    "Firebase user updated successfully. UID: {Uid}",
                    firebaseUid);
            }
            catch (FirebaseAuthException ex)
            {
                _logger.LogError(
                    ex,
                    "Firebase user update failed. UID: {Uid}, ErrorCode: {ErrorCode}",
                    firebaseUid,
                    ex.AuthErrorCode);

                throw new InvalidOperationException(
                    $"Failed to update Firebase user: {GetUserFriendlyErrorMessage(ex)}",
                    ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error updating Firebase user. UID: {Uid}", firebaseUid);
                throw;
            }
        }

        public async Task DisableFirebaseUserAsync(string firebaseUid)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(firebaseUid))
                    throw new ArgumentException("Firebase UID is required", nameof(firebaseUid));

                await FirebaseAuth.DefaultInstance.UpdateUserAsync(new UserRecordArgs
                {
                    Uid = firebaseUid,
                    Disabled = true
                });

                _logger.LogInformation("Firebase user disabled. UID: {Uid}", firebaseUid);
            }
            catch (FirebaseAuthException ex) when (ex.AuthErrorCode == AuthErrorCode.UserNotFound)
            {
                _logger.LogWarning("Firebase user not found for disable operation. UID: {Uid}", firebaseUid);
                // Don't throw - user is already gone
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error disabling Firebase user. UID: {Uid}", firebaseUid);
                throw;
            }
        }

        public async Task EnableFirebaseUserAsync(string firebaseUid)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(firebaseUid))
                    throw new ArgumentException("Firebase UID is required", nameof(firebaseUid));

                await FirebaseAuth.DefaultInstance.UpdateUserAsync(new UserRecordArgs
                {
                    Uid = firebaseUid,
                    Disabled = false
                });

                _logger.LogInformation("Firebase user enabled. UID: {Uid}", firebaseUid);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enabling Firebase user. UID: {Uid}", firebaseUid);
                throw;
            }
        }

        public async Task DeleteFirebaseUserAsync(string firebaseUid)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(firebaseUid))
                    throw new ArgumentException("Firebase UID is required", nameof(firebaseUid));

                await FirebaseAuth.DefaultInstance.DeleteUserAsync(firebaseUid);

                _logger.LogInformation("Firebase user deleted. UID: {Uid}", firebaseUid);
            }
            catch (FirebaseAuthException ex) when (ex.AuthErrorCode == AuthErrorCode.UserNotFound)
            {
                _logger.LogWarning("Firebase user not found for deletion. UID: {Uid}", firebaseUid);
                // Don't throw - user is already gone
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting Firebase user. UID: {Uid}", firebaseUid);
                throw;
            }
        }

        public async Task<FirebaseUserInfo?> GetFirebaseUserAsync(string firebaseUid)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(firebaseUid))
                    throw new ArgumentException("Firebase UID is required", nameof(firebaseUid));

                var userRecord = await FirebaseAuth.DefaultInstance.GetUserAsync(firebaseUid);

                return new FirebaseUserInfo
                {
                    Uid = userRecord.Uid,
                    Email = userRecord.Email,
                    EmailVerified = userRecord.EmailVerified,
                    DisplayName = userRecord.DisplayName,
                    PhoneNumber = userRecord.PhoneNumber,
                    Disabled = userRecord.Disabled,
                    TokensValidAfterTimestamp = ((DateTimeOffset)userRecord.TokensValidAfterTimestamp).ToUnixTimeSeconds()
                };
            }
            catch (FirebaseAuthException ex) when (ex.AuthErrorCode == AuthErrorCode.UserNotFound)
            {
                _logger.LogWarning("Firebase user not found. UID: {Uid}", firebaseUid);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Firebase user. UID: {Uid}", firebaseUid);
                throw;
            }
        }

        public async Task<FirebaseTokenInfo> VerifyIdTokenAsync(string idToken, bool checkRevoked = true)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(idToken))
                    throw new ArgumentException("ID token is required", nameof(idToken));

                var decodedToken = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(idToken, checkRevoked);

                return new FirebaseTokenInfo
                {
                    Uid = decodedToken.Uid,
                    Email = decodedToken.Claims.TryGetValue("email", out var email) ? email?.ToString() : null,
                    EmailVerified = decodedToken.Claims.TryGetValue("email_verified", out var verified) &&
                                     verified is bool v && v,
                    Claims = decodedToken.Claims.ToDictionary(kvp => kvp.Key, kvp => kvp.Value),
                    IssuedAtTimestamp = decodedToken.IssuedAtTimeSeconds,
                    ExpirationTimestamp = decodedToken.ExpirationTimeSeconds
                };
            }
            catch (FirebaseAuthException ex)
            {
                _logger.LogWarning(
                    "Firebase ID token verification failed. ErrorCode: {ErrorCode}",
                    ex.AuthErrorCode);

                throw new UnauthorizedAccessException(
                    $"Invalid Firebase ID token: {GetUserFriendlyErrorMessage(ex)}",
                    ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error verifying Firebase ID token");
                throw;
            }
        }

        public async Task RevokeRefreshTokensAsync(string firebaseUid)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(firebaseUid))
                    throw new ArgumentException("Firebase UID is required", nameof(firebaseUid));

                await FirebaseAuth.DefaultInstance.RevokeRefreshTokensAsync(firebaseUid);

                _logger.LogInformation("Refresh tokens revoked for user. UID: {Uid}", firebaseUid);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking refresh tokens. UID: {Uid}", firebaseUid);
                throw;
            }
        }

        public async Task SetPasswordAsync(string firebaseUid, string password)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(firebaseUid))
                    throw new ArgumentException("Firebase UID is required", nameof(firebaseUid));

                if (string.IsNullOrWhiteSpace(password))
                    throw new ArgumentException("Password is required", nameof(password));

                if (password.Length < 6)
                    throw new ArgumentException("Password must be at least 6 characters", nameof(password));

                await FirebaseAuth.DefaultInstance.UpdateUserAsync(new UserRecordArgs
                {
                    Uid = firebaseUid,
                    Password = password
                });

                _logger.LogInformation("Password updated successfully for user. UID: {Uid}", firebaseUid);
            }
            catch (FirebaseAuthException ex)
            {
                _logger.LogError(
                    ex,
                    "Firebase password update failed. UID: {Uid}, ErrorCode: {ErrorCode}",
                    firebaseUid,
                    ex.AuthErrorCode);

                throw new InvalidOperationException(
                    $"Failed to set Firebase password: {GetUserFriendlyErrorMessage(ex)}",
                    ex);
            }
            catch (ArgumentException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error setting Firebase password. UID: {Uid}", firebaseUid);
                throw;
            }
        }

        private static string GetUserFriendlyErrorMessage(FirebaseAuthException ex)
        {
            return ex.AuthErrorCode switch
            {
                AuthErrorCode.EmailAlreadyExists => "Email address is already in use.",
                AuthErrorCode.PhoneNumberAlreadyExists => "Phone number is already in use.",
                AuthErrorCode.UserNotFound => "User not found.",
                AuthErrorCode.ExpiredIdToken => "Authentication token has expired.",
                AuthErrorCode.InvalidIdToken => "Invalid authentication token.",
                AuthErrorCode.RevokedIdToken => "Authentication token has been revoked.",
                AuthErrorCode.RevokedSessionCookie => "Session has been revoked.",
                _ => "An error occurred during Firebase operation."
            };
        }
    }
}

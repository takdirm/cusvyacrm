using System.Threading.Tasks;

namespace Scootr.Data.Services.Firebase
{
    /// <summary>
    /// Service for managing Firebase Authentication users using Firebase Admin SDK.
    /// Handles creation, update, deletion, and status management of Firebase users.
    /// </summary>
    public interface IFirebaseUserManagementService
    {
        /// <summary>
        /// Creates a new Firebase Authentication user.
        /// </summary>
        /// <param name="email">User email address (must be unique in Firebase)</param>
        /// <param name="password">Initial password (optional - can be set later via password reset)</param>
        /// <param name="displayName">Display name for the user (optional)</param>
        /// <param name="phoneNumber">Phone number (optional, must be in E.164 format)</param>
        /// <param name="emailVerified">Whether the email should be marked as verified (default: false)</param>
        /// <returns>Firebase UID of the created user</returns>
        Task<string> CreateFirebaseUserAsync(
            string email,
            string? password = null,
            string? displayName = null,
            string? phoneNumber = null,
            bool emailVerified = false);

        /// <summary>
        /// Updates an existing Firebase Authentication user.
        /// </summary>
        /// <param name="firebaseUid">Firebase UID of the user to update</param>
        /// <param name="email">New email (optional)</param>
        /// <param name="displayName">New display name (optional)</param>
        /// <param name="phoneNumber">New phone number (optional)</param>
        /// <param name="disabled">Whether to disable the account (optional)</param>
        /// <param name="emailVerified">Update email verification status (optional)</param>
        Task UpdateFirebaseUserAsync(
            string firebaseUid,
            string? email = null,
            string? displayName = null,
            string? phoneNumber = null,
            bool? disabled = null,
            bool? emailVerified = null);

        /// <summary>
        /// Disables a Firebase Authentication user account.
        /// User will not be able to sign in but the account remains.
        /// </summary>
        /// <param name="firebaseUid">Firebase UID</param>
        Task DisableFirebaseUserAsync(string firebaseUid);

        /// <summary>
        /// Enables a previously disabled Firebase Authentication user account.
        /// </summary>
        /// <param name="firebaseUid">Firebase UID</param>
        Task EnableFirebaseUserAsync(string firebaseUid);

        /// <summary>
        /// Deletes a Firebase Authentication user permanently.
        /// This action cannot be undone.
        /// </summary>
        /// <param name="firebaseUid">Firebase UID</param>
        Task DeleteFirebaseUserAsync(string firebaseUid);

        /// <summary>
        /// Retrieves Firebase user information by UID.
        /// </summary>
        /// <param name="firebaseUid">Firebase UID</param>
        /// <returns>Firebase user record or null if not found</returns>
        Task<FirebaseUserInfo?> GetFirebaseUserAsync(string firebaseUid);

        /// <summary>
        /// Verifies a Firebase ID token and returns the decoded token.
        /// </summary>
        /// <param name="idToken">Firebase ID token from client</param>
        /// <param name="checkRevoked">Whether to check if token has been revoked (default: true)</param>
        /// <returns>Decoded Firebase token containing UID and claims</returns>
        Task<FirebaseTokenInfo> VerifyIdTokenAsync(string idToken, bool checkRevoked = true);

        /// <summary>
        /// Revokes all refresh tokens for a user, forcing them to sign in again.
        /// Useful for immediate sign-out enforcement.
        /// </summary>
        /// <param name="firebaseUid">Firebase UID</param>
        Task RevokeRefreshTokensAsync(string firebaseUid);

        /// <summary>
        /// Sets or updates the password for a Firebase Authentication user.
        /// </summary>
        /// <param name="firebaseUid">Firebase UID of the user</param>
        /// <param name="password">New password (minimum 6 characters required by Firebase)</param>
        Task SetPasswordAsync(string firebaseUid, string password);
    }

    /// <summary>
    /// Firebase user information returned from GetFirebaseUserAsync.
    /// </summary>
    public class FirebaseUserInfo
    {
        public string Uid { get; set; } = string.Empty;
        public string? Email { get; set; }
        public bool EmailVerified { get; set; }
        public string? DisplayName { get; set; }
        public string? PhoneNumber { get; set; }
        public bool Disabled { get; set; }
        public long TokensValidAfterTimestamp { get; set; }
    }

    /// <summary>
    /// Decoded Firebase token information from VerifyIdTokenAsync.
    /// </summary>
    public class FirebaseTokenInfo
    {
        public string Uid { get; set; } = string.Empty;
        public string? Email { get; set; }
        public bool EmailVerified { get; set; }
        public Dictionary<string, object> Claims { get; set; } = new();
        public long IssuedAtTimestamp { get; set; }
        public long ExpirationTimestamp { get; set; }
    }
}

using Scootr.Core.Domain.Users;
using System.Security.Claims;

namespace Scootr.Data.Services.Authentication
{
    /// <summary>
    /// Service for accessing the currently authenticated user throughout the application.
    /// </summary>
    public interface ICurrentUserService
    {
        /// <summary>
        /// Gets the Scootr user ID of the current authenticated user.
        /// </summary>
        int? UserId { get; }

        /// <summary>
        /// Gets the Firebase UID of the current authenticated user.
        /// </summary>
        string? FirebaseUid { get; }

        /// <summary>
        /// Gets the email of the current authenticated user.
        /// </summary>
        string? Email { get; }

        /// <summary>
        /// Gets the user level/role of the current authenticated user.
        /// </summary>
        UserLevel? Level { get; }

        /// <summary>
        /// Gets the username of the current authenticated user.
        /// </summary>
        string? Username { get; }

        /// <summary>
        /// Checks if the current user is authenticated.
        /// </summary>
        bool IsAuthenticated { get; }

        /// <summary>
        /// Checks if the current user is an Admin.
        /// </summary>
        bool IsAdmin { get; }

        /// <summary>
        /// Checks if the current user is Staff or higher.
        /// </summary>
        bool IsStaff { get; }

        /// <summary>
        /// Gets the full User entity of the current authenticated user from the database.
        /// </summary>
        Task<User?> GetCurrentUserAsync();

        /// <summary>
        /// Gets all claims of the current user.
        /// </summary>
        IEnumerable<Claim> GetClaims();
    }
}

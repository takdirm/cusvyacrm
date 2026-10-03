using System.Collections.Generic;
using System.Threading.Tasks;
using Scootr.Core;
using Scootr.Core.Domain.Users;

namespace Scootr.Data.Services.Users
{
    /// <summary>
    /// Service for managing Scootr users with Firebase Authentication synchronization.
    /// This is the primary service for user CRUD operations.
    /// </summary>
    public interface IUserService
    {
        /// <summary>
        /// Retrieves a user by their Scootr database ID.
        /// </summary>
        Task<User?> GetByIdAsync(int id);

        /// <summary>
        /// Retrieves a user by their Firebase UID.
        /// </summary>
        Task<User?> GetByFirebaseUidAsync(string firebaseUid);

        /// <summary>
        /// Retrieves a user by their email address.
        /// </summary>
        Task<User?> GetByEmailAsync(string email);

        /// <summary>
        /// Retrieves a user by their username.
        /// </summary>
        Task<User?> GetByUsernameAsync(string username);

        /// <summary>
        /// Retrieves all users.
        /// </summary>
        Task<IEnumerable<User>> GetAllAsync();

        /// <summary>
        /// Retrieves a paginated list of users, optionally filtered by active status.
        /// </summary>
        Task<PaginatedResult<User>> GetPaginatedAsync(int page, int pageSize, bool? isActive = null);

        /// <summary>
        /// Creates a new user in both Scootr database and Firebase Authentication.
        /// Creates Firebase user first, then creates Scootr user with the Firebase UID.
        /// If Scootr creation fails, attempts to delete the Firebase user for cleanup.
        /// </summary>
        /// <param name="name">User's full name</param>
        /// <param name="email">Email address (must be unique)</param>
        /// <param name="username">Username (optional)</param>
        /// <param name="phone">Phone number (optional)</param>
        /// <param name="password">Initial Firebase password (optional)</param>
        /// <param name="level">User level/role (default: Customer)</param>
        /// <param name="isActive">Active status (default: true)</param>
        /// <returns>Created Scootr user with Firebase UID populated</returns>
        Task<User> CreateUserWithFirebaseAsync(
            string name,
            string email,
            string? username = null,
            string? phone = null,
            string? password = null,
            UserLevel level = UserLevel.Customer,
            bool isActive = true);

        /// <summary>
        /// Updates an existing user in Scootr database and synchronizes changes to Firebase.
        /// Updates Firebase-owned fields (email, displayName, phone) if changed.
        /// </summary>
        /// <param name="id">Scootr user ID</param>
        /// <param name="name">Updated name</param>
        /// <param name="email">Updated email (will update Firebase)</param>
        /// <param name="username">Updated username</param>
        /// <param name="phone">Updated phone (will update Firebase)</param>
        /// <param name="level">Updated user level</param>
        /// <param name="isActive">Updated active status (will disable/enable Firebase account)</param>
        /// <returns>True if update was successful</returns>
        Task<bool> UpdateUserAsync(
            int id,
            string name,
            string email,
            string? username = null,
            string? phone = null,
            UserLevel? level = null,
            bool? isActive = null);

        /// <summary>
        /// Deactivates a user (soft delete).
        /// Sets IsActive = false in Scootr and disables Firebase account.
        /// Preferred over hard delete.
        /// </summary>
        Task<bool> DeactivateUserAsync(int id);

        /// <summary>
        /// Reactivates a previously deactivated user.
        /// Sets IsActive = true and enables Firebase account.
        /// </summary>
        Task<bool> ReactivateUserAsync(int id);

        /// <summary>
        /// Deletes a user permanently from both Scootr database and Firebase.
        /// This action cannot be undone.
        /// WARNING: Use DeactivateUserAsync instead unless hard delete is required.
        /// </summary>
        Task<bool> DeleteUserAsync(int id);

        /// <summary>
        /// Checks if email already exists in the Scootr database.
        /// </summary>
        Task<bool> EmailExistsAsync(string email, int? excludeUserId = null);

        /// <summary>
        /// Checks if username already exists in the Scootr database.
        /// </summary>
        Task<bool> UsernameExistsAsync(string username, int? excludeUserId = null);

        /// <summary>
        /// Sets or updates the Firebase password for a user.
        /// Requires the user to have a Firebase UID.
        /// </summary>
        /// <param name="userId">Scootr user ID</param>
        /// <param name="password">New password (minimum 6 characters required by Firebase)</param>
        Task<bool> SetFirebasePasswordAsync(int userId, string password);
    }
}

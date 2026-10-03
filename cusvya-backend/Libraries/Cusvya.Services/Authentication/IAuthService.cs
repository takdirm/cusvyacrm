using System.Collections.Generic;
using System.Threading.Tasks;
using Scootr.Core.Domain.Users;
using Forecast.Ordering.Core;
using Scootr.Core;
using Scootr.Core.Domain.Users; // For PaginatedResult

namespace Scootr.Data.Services.Authentication
{
    public interface IAuthService           
    {
        /// <summary>
        /// Retrieves a user by their unique identifier asynchronously.
        /// </summary>
        /// <param name="id">The user ID.</param>
        /// <returns>The user if found; otherwise, null.</returns>
        Task<User?> GetByIdAsync(int id);

        /// <summary>
        /// Retrieves all users asynchronously.
        /// </summary>
        /// <returns>A collection of all users.</returns>
        Task<IEnumerable<User>> GetAllAsync();

        /// <summary>
        /// Retrieves a paginated list of users, optionally filtered by active status.
        /// </summary>
        /// <param name="page">The page number (1-based).</param>
        /// <param name="pageSize">The number of users per page.</param>
        /// <param name="isActive">Optional. If specified, filters users by their active status.</param>
        /// <returns>A paginated result of users.</returns>
        Task<PaginatedResult<User>> GetPaginatedAsync(int page, int pageSize, bool? isActive = null);

        /// <summary>
        /// Creates a new user asynchronously.
        /// </summary>
        /// <param name="user">The user to create.</param>
        /// <returns>The created user.</returns>
        Task<User> CreateAsync(User user);

        /// <summary>
        /// Updates an existing user asynchronously.
        /// </summary>
        /// <param name="user">The user to update.</param>
        /// <returns>True if the update was successful; otherwise, false.</returns>
        Task<bool> UpdateAsync(User user);

        /// <summary>
        /// Deletes a user by their unique identifier asynchronously.
        /// </summary>
        /// <param name="id">The user ID.</param>
        /// <returns>True if the deletion was successful; otherwise, false.</returns>
        Task<bool> DeleteAsync(int id);

        Task<User?> ValidateCredentialsAsync(string username, string password);


        Task<bool> ChangePasswordAsync(string username, string newPassword);


    }
}

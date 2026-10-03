using Microsoft.Extensions.Logging;
using Scootr.Core;
using Scootr.Core.Domain.Users;
using Scootr.Data.Repositories.Interfaces;
using Scootr.Data.Services.Firebase;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Scootr.Data.Services.Users
{
    /// <summary>
    /// Implementation of IUserService with Firebase Authentication synchronization.
    /// </summary>
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IFirebaseUserManagementService _firebaseService;
        private readonly ILogger<UserService> _logger;

        public UserService(
            IUnitOfWork unitOfWork,
            IFirebaseUserManagementService firebaseService,
            ILogger<UserService> logger)
        {
            _unitOfWork = unitOfWork;
            _firebaseService = firebaseService;
            _logger = logger;
        }

        public async Task<User?> GetByIdAsync(int id)
        {
            return await _unitOfWork.Users.GetByIdAsync(id);
        }

        public async Task<User?> GetByFirebaseUidAsync(string firebaseUid)
        {
            if (string.IsNullOrWhiteSpace(firebaseUid))
                return null;

            return await _unitOfWork.Users.FirstOrDefaultAsync(u => u.UID == firebaseUid);
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return null;

            return await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return null;

            return await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _unitOfWork.Users.GetAllAsync();
        }

        public async Task<PaginatedResult<User>> GetPaginatedAsync(int page, int pageSize, bool? isActive = null)
        {
            Expression<Func<User, bool>>? predicate = null;

            if (isActive.HasValue)
            {
                predicate = u => u.IsActive == isActive.Value;
            }

            var (items, totalCount) = await _unitOfWork.Users.GetPagedAsync(
                pageNumber: page,
                pageSize: pageSize,
                predicate: predicate,
                orderBy: query => query.OrderByDescending(u => u.CreatedAt)
            );

            return new PaginatedResult<User>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<User> CreateUserWithFirebaseAsync(
            string name,
            string email,
            string? username = null,
            string? phone = null,
            string? password = null,
            UserLevel level = UserLevel.Customer,
            bool isActive = true)
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Name is required", nameof(name));

            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email is required", nameof(email));

            _logger.LogInformation("Creating user: {Email}, Level: {Level}", email, level);

            // Check for duplicate email in Scootr database
            if (await EmailExistsAsync(email))
            {
                throw new InvalidOperationException($"Email '{email}' is already in use.");
            }

            // Check for duplicate username if provided
            if (!string.IsNullOrWhiteSpace(username) && await UsernameExistsAsync(username))
            {
                throw new InvalidOperationException($"Username '{username}' is already in use.");
            }

            string? firebaseUid = null;

            try
            {
                // Step 1: Create Firebase user first
                firebaseUid = await _firebaseService.CreateFirebaseUserAsync(
                    email: email,
                    password: password,
                    displayName: name,
                    phoneNumber: phone,
                    emailVerified: false
                );

                _logger.LogInformation("Firebase user created. UID: {Uid}", firebaseUid);

                // Step 2: Create Scootr user with Firebase UID
                var user = new User
                {
                    Name = name,
                    Email = email,
                    Username = username ?? string.Empty,
                    Phone = phone ?? string.Empty,
                    Level = level,
                    IsActive = isActive,
                    UID = firebaseUid,
                    Password = string.Empty, // Never store Firebase password
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Users.AddAsync(user);
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation(
                    "Scootr user created successfully. ID: {UserId}, Firebase UID: {FirebaseUid}",
                    user.Id,
                    firebaseUid);

                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "User creation failed. Email: {Email}, Firebase UID: {FirebaseUid}",
                    email,
                    firebaseUid);

                // Cleanup: Delete Firebase user if Scootr user creation failed
                if (!string.IsNullOrWhiteSpace(firebaseUid))
                {
                    try
                    {
                        _logger.LogWarning("Attempting Firebase cleanup for UID: {Uid}", firebaseUid);
                        await _firebaseService.DeleteFirebaseUserAsync(firebaseUid);
                        _logger.LogInformation("Firebase user cleanup successful. UID: {Uid}", firebaseUid);
                    }
                    catch (Exception cleanupEx)
                    {
                        _logger.LogError(
                            cleanupEx,
                            "Firebase cleanup failed. Orphan Firebase user may exist. UID: {Uid}",
                            firebaseUid);
                    }
                }

                throw;
            }
        }

        public async Task<bool> UpdateUserAsync(
            int id,
            string name,
            string email,
            string? username = null,
            string? phone = null,
            UserLevel? level = null,
            bool? isActive = null)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            if (user == null)
            {
                _logger.LogWarning("User not found for update. ID: {UserId}", id);
                return false;
            }

            _logger.LogInformation("Updating user. ID: {UserId}, Firebase UID: {Uid}", id, user.UID);

            try
            {
                // Track what changed for Firebase sync
                bool emailChanged = !string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase);
                bool nameChanged = user.Name != name;
                bool phoneChanged = user.Phone != (phone ?? string.Empty);
                bool isActiveChanged = isActive.HasValue && user.IsActive != isActive.Value;

                // Check for duplicate email if changing
                if (emailChanged && await EmailExistsAsync(email, id))
                {
                    throw new InvalidOperationException($"Email '{email}' is already in use.");
                }

                // Check for duplicate username if changing
                if (!string.IsNullOrWhiteSpace(username) &&
                    user.Username != username &&
                    await UsernameExistsAsync(username, id))
                {
                    throw new InvalidOperationException($"Username '{username}' is already in use.");
                }

                // Update Scootr user
                user.Name = name;
                user.Email = email;
                user.Username = username ?? string.Empty;
                user.Phone = phone ?? string.Empty;

                if (level.HasValue)
                    user.Level = level.Value;

                if (isActive.HasValue)
                    user.IsActive = isActive.Value;

                await _unitOfWork.Users.UpdateAsync(user);
                await _unitOfWork.SaveChangesAsync();

                // Sync changes to Firebase if UID exists
                if (!string.IsNullOrWhiteSpace(user.UID))
                {
                    try
                    {
                        await _firebaseService.UpdateFirebaseUserAsync(
                            firebaseUid: user.UID,
                            email: emailChanged ? email : null,
                            displayName: nameChanged ? name : null,
                            phoneNumber: phoneChanged ? phone : null,
                            disabled: isActiveChanged ? !isActive.Value : null
                        );

                        _logger.LogInformation("Firebase user updated. UID: {Uid}", user.UID);
                    }
                    catch (Exception fbEx)
                    {
                        _logger.LogError(
                            fbEx,
                            "Firebase update failed but Scootr user was updated. UID: {Uid}",
                            user.UID);
                        // Don't fail the entire operation if Firebase update fails
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user. ID: {UserId}", id);
                throw;
            }
        }

        public async Task<bool> DeactivateUserAsync(int id)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            if (user == null)
                return false;

            _logger.LogInformation("Deactivating user. ID: {UserId}, Firebase UID: {Uid}", id, user.UID);

            user.IsActive = false;
            await _unitOfWork.Users.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();

            // Disable Firebase account
            if (!string.IsNullOrWhiteSpace(user.UID))
            {
                try
                {
                    await _firebaseService.DisableFirebaseUserAsync(user.UID);
                    _logger.LogInformation("Firebase user disabled. UID: {Uid}", user.UID);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to disable Firebase user. UID: {Uid}", user.UID);
                    // Don't fail the operation
                }
            }

            return true;
        }

        public async Task<bool> ReactivateUserAsync(int id)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            if (user == null)
                return false;

            _logger.LogInformation("Reactivating user. ID: {UserId}, Firebase UID: {Uid}", id, user.UID);

            user.IsActive = true;
            await _unitOfWork.Users.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();

            // Enable Firebase account
            if (!string.IsNullOrWhiteSpace(user.UID))
            {
                try
                {
                    await _firebaseService.EnableFirebaseUserAsync(user.UID);
                    _logger.LogInformation("Firebase user enabled. UID: {Uid}", user.UID);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to enable Firebase user. UID: {Uid}", user.UID);
                    // Don't fail the operation
                }
            }

            return true;
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            if (user == null)
                return false;

            _logger.LogWarning("HARD DELETE requested for user. ID: {UserId}, Firebase UID: {Uid}", id, user.UID);

            var firebaseUid = user.UID;

            // Delete from Scootr database
            var result = await _unitOfWork.Users.DeleteAsync(id);
            if (!result)
                return false;

            await _unitOfWork.SaveChangesAsync();

            // Delete from Firebase
            if (!string.IsNullOrWhiteSpace(firebaseUid))
            {
                try
                {
                    await _firebaseService.DeleteFirebaseUserAsync(firebaseUid);
                    _logger.LogInformation("Firebase user deleted. UID: {Uid}", firebaseUid);
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Failed to delete Firebase user. Orphan Firebase account may exist. UID: {Uid}",
                        firebaseUid);
                    // Don't fail the operation - Scootr user is already deleted
                }
            }

            return true;
        }

        public async Task<bool> EmailExistsAsync(string email, int? excludeUserId = null)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            var user = await _unitOfWork.Users.FirstOrDefaultAsync(
                u => u.Email == email && (!excludeUserId.HasValue || u.Id != excludeUserId.Value)
            );

            return user != null;
        }

        public async Task<bool> UsernameExistsAsync(string username, int? excludeUserId = null)
        {
            if (string.IsNullOrWhiteSpace(username))
                return false;

            var user = await _unitOfWork.Users.FirstOrDefaultAsync(
                u => u.Username == username && (!excludeUserId.HasValue || u.Id != excludeUserId.Value)
            );

            return user != null;
        }

        public async Task<bool> SetFirebasePasswordAsync(int userId, string password)
        {
            try
            {
                var user = await _unitOfWork.Users.GetByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User not found for password update. User ID: {UserId}", userId);
                    return false;
                }

                if (string.IsNullOrWhiteSpace(user.UID))
                {
                    _logger.LogError("User does not have a Firebase UID. User ID: {UserId}", userId);
                    throw new InvalidOperationException("User does not have a Firebase account");
                }

                await _firebaseService.SetPasswordAsync(user.UID, password);

                _logger.LogInformation(
                    "Firebase password updated for user. User ID: {UserId}, Firebase UID: {FirebaseUid}",
                    userId,
                    user.UID);

                return true;
            }
            catch (InvalidOperationException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting Firebase password for user. User ID: {UserId}", userId);
                throw;
            }
        }
    }
}

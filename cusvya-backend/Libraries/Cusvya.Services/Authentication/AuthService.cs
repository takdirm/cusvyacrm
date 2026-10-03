using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Scootr.Core;
using Scootr.Core.Domain.Users;
using Scootr.Data.Repositories.Interfaces;

// For PaginatedResult

namespace Scootr.Data.Services.Authentication
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;

        public AuthService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<User?> GetByIdAsync(int id)
        {
            return await _unitOfWork.Users.GetByIdAsync(id);
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
                orderBy: query => query.OrderByDescending(u => u.Id)
            );

            return new PaginatedResult<User>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<User> CreateAsync(User user)
        {
            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();
            return user;
        }

        public async Task<bool> UpdateAsync(User user)
        {
            var existing = await _unitOfWork.Users.GetByIdAsync(user.Id);
            if (existing == null) return false;

            // Update properties
            existing.Username = user.Username;
            existing.Email = user.Email;
            existing.Level = user.Level;
            existing.IsActive = user.IsActive;

            await _unitOfWork.Users.UpdateAsync(existing);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var result = await _unitOfWork.Users.DeleteAsync(id);
            if (!result) return false;

            await _unitOfWork.SaveChangesAsync();
            return true;
        }


        public async Task<User?> ValidateCredentialsAsync(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                return null;

            // For demo: plain text password check. Use hashing in production!
            var user = await _unitOfWork.Users
                .FirstOrDefaultAsync(u => u.Username == username && u.Password == password);

            return user;
        }

        public async Task<bool> ChangePasswordAsync(string username, string newPassword)
        {
            var user = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null)
                return false;

            user.Password = newPassword;
            await _unitOfWork.SaveChangesAsync();
            return true;
        }
    }
}

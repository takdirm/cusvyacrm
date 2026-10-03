using Microsoft.AspNetCore.Http;
using Scootr.Core.Domain.Users;
using Scootr.Data.Services.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Scootr.Data.Services.Authentication
{
    /// <summary>
    /// Implementation of ICurrentUserService using HttpContext.
    /// </summary>
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserService _userService;

        public CurrentUserService(
            IHttpContextAccessor httpContextAccessor,
            IUserService userService)
        {
            _httpContextAccessor = httpContextAccessor;
            _userService = userService;
        }

        private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

        public int? UserId
        {
            get
            {
                var userIdClaim = User?.FindFirst("uid") ?? User?.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
                    return userId;
                return null;
            }
        }

        public string? FirebaseUid => User?.FindFirst("firebase_uid")?.Value ?? User?.FindFirst("user_id")?.Value;

        public string? Email => User?.FindFirst(ClaimTypes.Email)?.Value ?? User?.FindFirst("email")?.Value;

        public UserLevel? Level
        {
            get
            {
                var levelClaim = User?.FindFirst("level")?.Value ?? User?.FindFirst(ClaimTypes.Role)?.Value;
                if (levelClaim != null && Enum.TryParse<UserLevel>(levelClaim, true, out var level))
                    return level;
                return null;
            }
        }

        public string? Username => User?.FindFirst(ClaimTypes.Name)?.Value ?? User?.FindFirst("username")?.Value;

        public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

        public bool IsAdmin => Level == UserLevel.Admin;

        public bool IsStaff => Level == UserLevel.Staff || Level == UserLevel.Admin;

        public async Task<User?> GetCurrentUserAsync()
        {
            if (!UserId.HasValue)
                return null;

            return await _userService.GetByIdAsync(UserId.Value);
        }

        public IEnumerable<Claim> GetClaims()
        {
            return User?.Claims ?? Enumerable.Empty<Claim>();
        }
    }
}

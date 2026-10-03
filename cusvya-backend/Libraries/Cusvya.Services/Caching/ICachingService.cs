using System;
using System.Threading.Tasks;

namespace Scootr.Data.Services.Caching
{
    /// <summary>
    /// Provides caching operations.
    /// </summary>
    public interface ICachingService
    {
        /// <summary>
        /// Gets a cached item by key.
        /// </summary>
        Task<T> GetAsync<T>(string key);

        /// <summary>
        /// Sets a cached item by key.
        /// </summary>
        Task SetAsync<T>(string key, T value, TimeSpan? absoluteExpirationRelativeToNow = null);

        /// <summary>
        /// Removes a cached item by key.
        /// </summary>
        Task RemoveAsync(string key);
    }
}
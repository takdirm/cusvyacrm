using Microsoft.Extensions.Caching.Distributed;
using System;
using System.Text.Json;
using System.Threading.Tasks;

namespace Scootr.Data.Services.Caching
{
    /// <summary>
    /// SQL Server-based implementation of ICachingService.
    /// </summary>
    public class CachingService : ICachingService
    {
        private readonly IDistributedCache _distributedCache;

        public CachingService(IDistributedCache distributedCache)
        {
            _distributedCache = distributedCache;
        }

        public async Task<T> GetAsync<T>(string key)
        {
            var cached = await _distributedCache.GetStringAsync(key);
            return cached == null ? default : JsonSerializer.Deserialize<T>(cached);
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? absoluteExpirationRelativeToNow = null)
        {
            var options = new DistributedCacheEntryOptions();
            if (absoluteExpirationRelativeToNow.HasValue)
                options.SetAbsoluteExpiration(absoluteExpirationRelativeToNow.Value);

            var json = JsonSerializer.Serialize(value);
            await _distributedCache.SetStringAsync(key, json, options);
        }

        public async Task RemoveAsync(string key)
        {
            await _distributedCache.RemoveAsync(key);
        }
    }
}
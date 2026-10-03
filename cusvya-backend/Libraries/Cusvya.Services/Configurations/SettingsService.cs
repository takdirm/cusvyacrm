using Scootr.Core.Domain.Settings;
using Scootr.Core.Helpers;
using Scootr.Data.Services.Caching;
using Scootr.Data.Repositories.Interfaces;
using System.ComponentModel;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace Scootr.Data.Services.Settings
{
    public partial class SettingsService : ISettingsService
    {
        #region Fields
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICachingService _cacheService;
        #endregion

        #region Ctor

        public SettingsService(IUnitOfWork unitOfWork, ICachingService cachingService)
        {
            _unitOfWork = unitOfWork;
            _cacheService = cachingService;
        }

        #endregion

        #region Utilities

        protected virtual async Task<IDictionary<string, IList<Setting>>> GetAllSettingsDictionaryAsync()
        {
            var settings = await GetAllSettingsAsync();
            var dictionary = new Dictionary<string, IList<Setting>>();
            foreach (var s in settings)
            {
                var resourceName = s.Name.ToLowerInvariant();
                var settingForCaching = new Setting
                {
                    Id = s.Id,
                    Name = s.Name,
                    Value = s.Value
                };
                if (!dictionary.ContainsKey(resourceName))
                    dictionary.Add(resourceName, new List<Setting> { settingForCaching });
                else
                    dictionary[resourceName].Add(settingForCaching);
            }
            return dictionary;
        }

        protected virtual IDictionary<string, IList<Setting>> GetAllSettingsDictionary()
        {
            var settings = GetAllSettings();
            var dictionary = new Dictionary<string, IList<Setting>>();
            foreach (var s in settings)
            {
                var resourceName = s.Name.ToLowerInvariant();
                var settingForCaching = new Setting
                {
                    Id = s.Id,
                    Name = s.Name,
                    Value = s.Value
                };
                if (!dictionary.ContainsKey(resourceName))
                    dictionary.Add(resourceName, new List<Setting> { settingForCaching });
                else
                    dictionary[resourceName].Add(settingForCaching);
            }
            return dictionary;
        }

        protected virtual async Task SetSettingAsync(Type type, string key, object value, bool clearCache = true)
        {
            if (key == null)
                throw new ArgumentNullException(nameof(key));
            key = key.Trim().ToLowerInvariant();
            var valueStr = TypeDescriptor.GetConverter(type).ConvertToInvariantString(value);

            var allSettings = await GetAllSettingsDictionaryAsync();
            var settingForCaching = allSettings.TryGetValue(key, out var settings) ?
                settings.FirstOrDefault() : null;
            if (settingForCaching != null)
            {
                var setting = await GetSettingByIdAsync(settingForCaching.Id);
                setting.Value = valueStr;
                await UpdateSettingAsync(setting, clearCache);
            }
            else
            {
                var setting = new Setting
                {
                    Name = key,
                    Value = valueStr
                };
                await InsertSettingAsync(setting, clearCache);
            }
        }

        protected virtual void SetSetting(Type type, string key, object value, bool clearCache = true)
        {
            if (key == null)
                throw new ArgumentNullException(nameof(key));
            key = key.Trim().ToLowerInvariant();
            var valueStr = TypeDescriptor.GetConverter(type).ConvertToInvariantString(value);

            var allSettings = GetAllSettingsDictionary();
            var settingForCaching = allSettings.TryGetValue(key, out var settings) ?
                settings.FirstOrDefault() : null;
            if (settingForCaching != null)
            {
                var setting = GetSettingById(settingForCaching.Id);
                setting.Value = valueStr;
                UpdateSetting(setting, clearCache);
            }
            else
            {
                var setting = new Setting
                {
                    Name = key,
                    Value = valueStr
                };
                InsertSetting(setting, clearCache);
            }
        }

        #endregion

        #region Methods

        public virtual async Task InsertSettingAsync(Setting setting, bool clearCache = true)
        {
            await _unitOfWork.Settings.AddAsync(setting);
            await _unitOfWork.SaveChangesAsync();
        }

        public virtual void InsertSetting(Setting setting, bool clearCache = true)
        {
            _unitOfWork.Settings.AddAsync(setting).Wait();
            _unitOfWork.SaveChangesAsync().Wait();
        }

        public virtual async Task UpdateSettingAsync(Setting setting, bool clearCache = true)
        {
            if (setting == null)
                throw new ArgumentNullException(nameof(setting));

            await _unitOfWork.Settings.UpdateAsync(setting);
            await _unitOfWork.SaveChangesAsync();
        }

        public virtual void UpdateSetting(Setting setting, bool clearCache = true)
        {
            if (setting == null)
                throw new ArgumentNullException(nameof(setting));

            _unitOfWork.Settings.UpdateAsync(setting).Wait();
            _unitOfWork.SaveChangesAsync().Wait();
        }

        public virtual async Task DeleteSettingAsync(Setting setting)
        {
            await _unitOfWork.Settings.DeleteAsync(setting);
            await _unitOfWork.SaveChangesAsync();
        }

        public virtual void DeleteSetting(Setting setting)
        {
            _unitOfWork.Settings.DeleteAsync(setting).Wait();
            _unitOfWork.SaveChangesAsync().Wait();
        }

        public virtual async Task DeleteSettingsAsync(IList<Setting> settings)
        {
            await _unitOfWork.Settings.DeleteRangeAsync(settings);
            await _unitOfWork.SaveChangesAsync();
        }

        public virtual async Task<Setting> GetSettingByIdAsync(long settingId)
        {
            return await _unitOfWork.Settings.GetByIdAsync((int)settingId);
        }

        public virtual Setting GetSettingById(long settingId)
        {
            return _unitOfWork.Settings.GetByIdAsync((int)settingId).Result;
        }

        public virtual async Task<Setting> GetSettingAsync(string key, bool loadSharedValueIfNotFound = false)
        {
            if (string.IsNullOrEmpty(key))
                return null;

            var settings = await GetAllSettingsDictionaryAsync();
            key = key.Trim().ToLowerInvariant();
            if (!settings.ContainsKey(key))
                return null;

            var settingsByKey = settings[key];
            var setting = settingsByKey.FirstOrDefault();
            return setting != null ? await GetSettingByIdAsync(setting.Id) : null;
        }

        public virtual Setting GetSetting(string key, bool loadSharedValueIfNotFound = false)
        {
            if (string.IsNullOrEmpty(key))
                return null;

            var settings = GetAllSettingsDictionary();
            key = key.Trim().ToLowerInvariant();
            if (!settings.ContainsKey(key))
                return null;

            var settingsByKey = settings[key];
            var setting = settingsByKey.FirstOrDefault();
            return setting != null ? GetSettingById(setting.Id) : null;
        }

        public virtual async Task<T> GetSettingByKeyAsync<T>(string key, T defaultValue = default, bool loadSharedValueIfNotFound = false)
        {
            if (string.IsNullOrEmpty(key))
                return defaultValue;

            var settings = await GetAllSettingsDictionaryAsync();
            key = key.Trim().ToLowerInvariant();
            if (!settings.ContainsKey(key))
                return defaultValue;

            var settingsByKey = settings[key];
            var setting = settingsByKey.FirstOrDefault();
            return setting != null ? CommonHelper.To<T>(setting.Value) : defaultValue;
        }

        public virtual T GetSettingByKey<T>(string key, T defaultValue = default, bool loadSharedValueIfNotFound = false)
        {
            if (string.IsNullOrEmpty(key))
                return defaultValue;

            var settings = GetAllSettingsDictionary();
            key = key.Trim().ToLowerInvariant();
            if (!settings.ContainsKey(key))
                return defaultValue;

            var settingsByKey = settings[key];
            var setting = settingsByKey.FirstOrDefault();
            return setting != null ? CommonHelper.To<T>(setting.Value) : defaultValue;
        }

        public virtual async Task SetSettingAsync<T>(string key, T value, bool clearCache = true)
        {
            await SetSettingAsync(typeof(T), key, value, clearCache);
        }

        public virtual void SetSetting<T>(string key, T value, bool clearCache = true)
        {
            SetSetting(typeof(T), key, value, clearCache);
        }

        public virtual async Task<IList<Setting>> GetAllSettingsAsync()
        {
            var settings = await _unitOfWork.Settings.GetAllAsync();
            return settings.OrderBy(s => s.Name).ToList();
        }

        public virtual IList<Setting> GetAllSettings()
        {
            var settings = _unitOfWork.Settings.GetAllAsync().Result;
            return settings.OrderBy(s => s.Name).ToList();
        }

        public virtual async Task<bool> SettingExistsAsync<T, TPropType>(T settings, Expression<Func<T, TPropType>> keySelector)
            where T : ISettings, new()
        {
            var key = GetSettingKey(settings, keySelector);
            var setting = await GetSettingByKeyAsync<string>(key);
            return setting != null;
        }

        public virtual bool SettingExists<T, TPropType>(T settings, Expression<Func<T, TPropType>> keySelector)
            where T : ISettings, new()
        {
            var key = GetSettingKey(settings, keySelector);
            var setting = GetSettingByKey<string>(key);
            return setting != null;
        }

        public virtual async Task<T> LoadSettingAsync<T>() where T : ISettings, new()
        {
            return (T)await LoadSettingAsync(typeof(T));
        }

        public virtual T LoadSetting<T>() where T : ISettings, new()
        {
            return (T)LoadSetting(typeof(T));
        }

        public virtual async Task<ISettings> LoadSettingAsync(Type type)
        {
            var settings = Activator.CreateInstance(type);
            foreach (var prop in type.GetProperties())
            {
                if (!prop.CanRead || !prop.CanWrite)
                    continue;

                var key = type.Name + "." + prop.Name;
                var setting = await GetSettingByKeyAsync<string>(key, loadSharedValueIfNotFound: true);
                if (setting == null)
                    continue;

                if (!TypeDescriptor.GetConverter(prop.PropertyType).CanConvertFrom(typeof(string)))
                    continue;

                if (!TypeDescriptor.GetConverter(prop.PropertyType).IsValid(setting))
                    continue;

                var value = TypeDescriptor.GetConverter(prop.PropertyType).ConvertFromInvariantString(setting);
                prop.SetValue(settings, value, null);
            }
            return settings as ISettings;
        }

        public virtual ISettings LoadSetting(Type type)
        {
            var settings = Activator.CreateInstance(type);
            foreach (var prop in type.GetProperties())
            {
                if (!prop.CanRead || !prop.CanWrite)
                    continue;

                var key = type.Name + "." + prop.Name;
                var setting = GetSettingByKey<string>(key, loadSharedValueIfNotFound: true);
                if (setting == null)
                    continue;

                if (!TypeDescriptor.GetConverter(prop.PropertyType).CanConvertFrom(typeof(string)))
                    continue;

                if (!TypeDescriptor.GetConverter(prop.PropertyType).IsValid(setting))
                    continue;

                var value = TypeDescriptor.GetConverter(prop.PropertyType).ConvertFromInvariantString(setting);
                prop.SetValue(settings, value, null);
            }
            return settings as ISettings;
        }

        public virtual async Task SaveSettingAsync<T>(T settings) where T : ISettings, new()
        {
            foreach (var prop in typeof(T).GetProperties())
            {
                if (!prop.CanRead || !prop.CanWrite)
                    continue;

                if (!TypeDescriptor.GetConverter(prop.PropertyType).CanConvertFrom(typeof(string)))
                    continue;

                var key = typeof(T).Name + "." + prop.Name;
                var value = prop.GetValue(settings, null);
                if (value != null)
                    await SetSettingAsync(prop.PropertyType, key, value, false);
                else
                    await SetSettingAsync(key, string.Empty, false);
            }
        }

        public virtual void SaveSetting<T>(T settings) where T : ISettings, new()
        {
            foreach (var prop in typeof(T).GetProperties())
            {
                if (!prop.CanRead || !prop.CanWrite)
                    continue;

                if (!TypeDescriptor.GetConverter(prop.PropertyType).CanConvertFrom(typeof(string)))
                    continue;

                var key = typeof(T).Name + "." + prop.Name;
                var value = prop.GetValue(settings, null);
                if (value != null)
                    SetSetting(prop.PropertyType, key, value, false);
                else
                    SetSetting(key, string.Empty, false);
            }
        }

        public virtual async Task SaveSettingAsync<T, TPropType>(T settings, Expression<Func<T, TPropType>> keySelector, bool clearCache = true)
            where T : ISettings, new()
        {
            if (keySelector.Body is not MemberExpression member)
                throw new ArgumentException($"Expression '{keySelector}' refers to a method, not a property.");

            var propInfo = member.Member as PropertyInfo;
            if (propInfo == null)
                throw new ArgumentException($"Expression '{keySelector}' refers to a field, not a property.");

            var key = GetSettingKey(settings, keySelector);
            var value = (TPropType)propInfo.GetValue(settings, null);
            if (value != null)
                await SetSettingAsync(key, value, clearCache);
            else
                await SetSettingAsync(key, string.Empty, clearCache);
        }

        public virtual void SaveSetting<T, TPropType>(T settings, Expression<Func<T, TPropType>> keySelector, bool clearCache = true)
            where T : ISettings, new()
        {
            if (keySelector.Body is not MemberExpression member)
                throw new ArgumentException($"Expression '{keySelector}' refers to a method, not a property.");

            var propInfo = member.Member as PropertyInfo;
            if (propInfo == null)
                throw new ArgumentException($"Expression '{keySelector}' refers to a field, not a property.");

            var key = GetSettingKey(settings, keySelector);
            var value = (TPropType)propInfo.GetValue(settings, null);
            if (value != null)
                SetSetting(key, value, clearCache);
            else
                SetSetting(key, string.Empty, clearCache);
        }

        public virtual async Task SaveSettingOverridablePerStoreAsync<T, TPropType>(T settings, Expression<Func<T, TPropType>> keySelector, bool overrideForStore, bool clearCache = true)
            where T : ISettings, new()
        {
            if (overrideForStore)
                await SaveSettingAsync(settings, keySelector, clearCache);
        }

        public virtual async Task DeleteSettingAsync<T>() where T : ISettings, new()
        {
            var settingsToDelete = new List<Setting>();
            var allSettings = await GetAllSettingsAsync();
            foreach (var prop in typeof(T).GetProperties())
            {
                var key = typeof(T).Name + "." + prop.Name;
                settingsToDelete.AddRange(allSettings.Where(x => x.Name.Equals(key, StringComparison.InvariantCultureIgnoreCase)));
            }
            await DeleteSettingsAsync(settingsToDelete);
        }

        public virtual async Task DeleteSettingAsync<T, TPropType>(T settings, Expression<Func<T, TPropType>> keySelector) where T : ISettings, new()
        {
            var key = GetSettingKey(settings, keySelector);
            key = key.Trim().ToLowerInvariant();

            var allSettings = await GetAllSettingsDictionaryAsync();
            var settingForCaching = allSettings.TryGetValue(key, out var settings_) ?
                settings_.FirstOrDefault() : null;
            if (settingForCaching == null)
                return;

            var setting = await GetSettingByIdAsync(settingForCaching.Id);
            await DeleteSettingAsync(setting);
        }

        public virtual string GetSettingKey<TSettings, T>(TSettings settings, Expression<Func<TSettings, T>> keySelector)
            where TSettings : ISettings, new()
        {
            if (keySelector.Body is not MemberExpression member)
                throw new ArgumentException($"Expression '{keySelector}' refers to a method, not a property.");

            if (member.Member is not PropertyInfo propInfo)
                throw new ArgumentException($"Expression '{keySelector}' refers to a field, not a property.");

            var key = $"{typeof(TSettings).Name}.{propInfo.Name}";
            return key;
        }

        #endregion
    }
}
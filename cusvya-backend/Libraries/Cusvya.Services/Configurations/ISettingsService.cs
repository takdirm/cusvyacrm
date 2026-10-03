using Scootr.Core.Domain.Settings;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Reflection;
using System.Threading.Tasks;

namespace Scootr.Data.Services.Settings
{
    public interface ISettingsService
    {
        /// <summary>
        /// Asynchronously inserts a new setting into the data store.
        /// </summary>
        Task InsertSettingAsync(Setting setting, bool clearCache = true);

        /// <summary>
        /// Inserts a new setting into the data store.
        /// </summary>
        void InsertSetting(Setting setting, bool clearCache = true);

        /// <summary>
        /// Asynchronously updates an existing setting in the data store.
        /// </summary>
        Task UpdateSettingAsync(Setting setting, bool clearCache = true);

        /// <summary>
        /// Updates an existing setting in the data store.
        /// </summary>
        void UpdateSetting(Setting setting, bool clearCache = true);

        /// <summary>
        /// Asynchronously deletes a setting from the data store.
        /// </summary>
        Task DeleteSettingAsync(Setting setting);

        /// <summary>
        /// Deletes a setting from the data store.
        /// </summary>
        void DeleteSetting(Setting setting);

        /// <summary>
        /// Asynchronously deletes a list of settings from the data store.
        /// </summary>
        Task DeleteSettingsAsync(IList<Setting> settings);

        /// <summary>
        /// Asynchronously retrieves a setting by its identifier.
        /// </summary>
        Task<Setting> GetSettingByIdAsync(long settingId);

        /// <summary>
        /// Retrieves a setting by its identifier.
        /// </summary>
        Setting GetSettingById(long settingId);

        /// <summary>
        /// Asynchronously retrieves a setting by its key.
        /// </summary>
        Task<Setting> GetSettingAsync(string key, bool loadSharedValueIfNotFound = false);

        /// <summary>
        /// Retrieves a setting by its key.
        /// </summary>
        Setting GetSetting(string key, bool loadSharedValueIfNotFound = false);

        /// <summary>
        /// Asynchronously retrieves a setting value by its key and converts it to the specified type.
        /// </summary>
        Task<T> GetSettingByKeyAsync<T>(string key, T defaultValue = default, bool loadSharedValueIfNotFound = false);

        /// <summary>
        /// Retrieves a setting value by its key and converts it to the specified type.
        /// </summary>
        T GetSettingByKey<T>(string key, T defaultValue = default, bool loadSharedValueIfNotFound = false);

        /// <summary>
        /// Asynchronously sets the value of a setting by its key and type.
        /// </summary>
        Task SetSettingAsync<T>(string key, T value, bool clearCache = true);

        /// <summary>
        /// Sets the value of a setting by its key and type.
        /// </summary>
        void SetSetting<T>(string key, T value, bool clearCache = true);

        /// <summary>
        /// Asynchronously retrieves all settings.
        /// </summary>
        Task<IList<Setting>> GetAllSettingsAsync();

        /// <summary>
        /// Retrieves all settings.
        /// </summary>
        IList<Setting> GetAllSettings();

        /// <summary>
        /// Asynchronously determines whether a setting exists for the specified property.
        /// </summary>
        Task<bool> SettingExistsAsync<T, TPropType>(T settings, Expression<Func<T, TPropType>> keySelector) where T : ISettings, new();

        /// <summary>
        /// Determines whether a setting exists for the specified property.
        /// </summary>
        bool SettingExists<T, TPropType>(T settings, Expression<Func<T, TPropType>> keySelector) where T : ISettings, new();

        /// <summary>
        /// Asynchronously loads settings of the specified type.
        /// </summary>
        Task<T> LoadSettingAsync<T>() where T : ISettings, new();

        /// <summary>
        /// Loads settings of the specified type.
        /// </summary>
        T LoadSetting<T>() where T : ISettings, new();

        /// <summary>
        /// Asynchronously loads settings for the specified type.
        /// </summary>
        Task<ISettings> LoadSettingAsync(Type type);

        /// <summary>
        /// Loads settings for the specified type.
        /// </summary>
        ISettings LoadSetting(Type type);

        /// <summary>
        /// Asynchronously saves all properties of a settings object.
        /// </summary>
        Task SaveSettingAsync<T>(T settings) where T : ISettings, new();

        /// <summary>
        /// Saves all properties of a settings object.
        /// </summary>
        void SaveSetting<T>(T settings) where T : ISettings, new();

        /// <summary>
        /// Asynchronously saves a specific property of a settings object.
        /// </summary>
        Task SaveSettingAsync<T, TPropType>(T settings, Expression<Func<T, TPropType>> keySelector, bool clearCache = true) where T : ISettings, new();

        /// <summary>
        /// Saves a specific property of a settings object.
        /// </summary>
        void SaveSetting<T, TPropType>(T settings, Expression<Func<T, TPropType>> keySelector, bool clearCache = true) where T : ISettings, new();

        /// <summary>
        /// Asynchronously saves a property of a settings object, optionally for a specific store.
        /// </summary>
        Task SaveSettingOverridablePerStoreAsync<T, TPropType>(T settings, Expression<Func<T, TPropType>> keySelector, bool overrideForStore, bool clearCache = true) where T : ISettings, new();

        /// <summary>
        /// Asynchronously deletes all settings of the specified type.
        /// </summary>
        Task DeleteSettingAsync<T>() where T : ISettings, new();

        /// <summary>
        /// Asynchronously deletes a specific property of a settings object.
        /// </summary>
        Task DeleteSettingAsync<T, TPropType>(T settings, Expression<Func<T, TPropType>> keySelector) where T : ISettings, new();

        /// <summary>
        /// Gets the key for a setting property.
        /// </summary>
        string GetSettingKey<TSettings, T>(TSettings settings, Expression<Func<TSettings, T>> keySelector) where TSettings : ISettings, new();
    }
}
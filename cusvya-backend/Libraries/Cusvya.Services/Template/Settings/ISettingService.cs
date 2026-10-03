using Cusvya.Core.Template.Entities;

namespace Cusvya.Services.Template.Settings;

public interface ISettingService
{
    Task<List<Setting>> ListAsync(CancellationToken cancellationToken = default);
    Task<Setting?> GetAsync(int id, CancellationToken cancellationToken = default);
    Task<Setting> UpsertAsync(Setting setting, CancellationToken cancellationToken = default);
}


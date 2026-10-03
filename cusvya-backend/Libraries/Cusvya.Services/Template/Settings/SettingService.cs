using Cusvya.Core.Template.Entities;
using Cusvya.Data.Template.Repositories;

namespace Cusvya.Services.Template.Settings;

public sealed class SettingService(IUnitOfWork unitOfWork) : ISettingService
{
    public Task<List<Setting>> ListAsync(CancellationToken cancellationToken = default)
    {
        return unitOfWork.Settings.ListAsync(cancellationToken);
    }

    public Task<Setting?> GetAsync(int id, CancellationToken cancellationToken = default)
    {
        return unitOfWork.Settings.GetByIdAsync(id, cancellationToken);
    }

    public async Task<Setting> UpsertAsync(Setting setting, CancellationToken cancellationToken = default)
    {
        var existingByKey = (await unitOfWork.Settings
                .FindAsync(x => x.Key == setting.Key, cancellationToken))
            .FirstOrDefault();

        if (existingByKey is null)
        {
            await unitOfWork.Settings.AddAsync(setting, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return setting;
        }

        existingByKey.Value = setting.Value;
        existingByKey.Description = setting.Description;
        existingByKey.UpdatedAtUtc = DateTime.UtcNow;
        unitOfWork.Settings.Update(existingByKey);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return existingByKey;
    }
}


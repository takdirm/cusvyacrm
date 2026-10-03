using Cusvya.Core.Template.Entities;
using Cusvya.Data.Template.Repositories;

namespace Cusvya.Services.Template.Users;

public sealed class UserService(IUnitOfWork unitOfWork) : IUserService
{
    public Task<List<User>> ListAsync(CancellationToken cancellationToken = default)
    {
        return unitOfWork.Users.ListAsync(cancellationToken);
    }

    public Task<User?> GetAsync(int id, CancellationToken cancellationToken = default)
    {
        return unitOfWork.Users.GetByIdAsync(id, cancellationToken);
    }

    public async Task<User?> GetByFirebaseUidAsync(string firebaseUid, CancellationToken cancellationToken = default)
    {
        var result = await unitOfWork.Users.FindAsync(x => x.FirebaseUid == firebaseUid, cancellationToken);
        return result.FirstOrDefault();
    }

    public async Task<User> CreateAsync(User user, CancellationToken cancellationToken = default)
    {
        var created = await unitOfWork.Users.AddAsync(user, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return created;
    }

    public async Task<User?> UpdateAsync(int id, User user, CancellationToken cancellationToken = default)
    {
        var existing = await unitOfWork.Users.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        existing.Name = user.Name;
        existing.Email = user.Email;
        existing.PhoneNumber = user.PhoneNumber;
        existing.IsActive = user.IsActive;
        existing.UpdatedAtUtc = DateTime.UtcNow;

        unitOfWork.Users.Update(existing);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task<User> UpsertByFirebaseUidAsync(User user, CancellationToken cancellationToken = default)
    {
        var existing = await GetByFirebaseUidAsync(user.FirebaseUid, cancellationToken);
        if (existing is null)
        {
            return await CreateAsync(user, cancellationToken);
        }

        existing.Name = string.IsNullOrWhiteSpace(user.Name) ? existing.Name : user.Name;
        existing.Email = string.IsNullOrWhiteSpace(user.Email) ? existing.Email : user.Email;
        existing.PhoneNumber = string.IsNullOrWhiteSpace(user.PhoneNumber) ? existing.PhoneNumber : user.PhoneNumber;
        existing.IsActive = user.IsActive;
        existing.UpdatedAtUtc = DateTime.UtcNow;

        unitOfWork.Users.Update(existing);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return existing;
    }
}

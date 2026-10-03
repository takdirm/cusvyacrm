using Cusvya.Core.Template.Entities;

namespace Cusvya.Services.Template.Users;

public interface IUserService
{
    Task<List<User>> ListAsync(CancellationToken cancellationToken = default);
    Task<User?> GetAsync(int id, CancellationToken cancellationToken = default);
    Task<User?> GetByFirebaseUidAsync(string firebaseUid, CancellationToken cancellationToken = default);
    Task<User> CreateAsync(User user, CancellationToken cancellationToken = default);
    Task<User?> UpdateAsync(int id, User user, CancellationToken cancellationToken = default);
    Task<User> UpsertByFirebaseUidAsync(User user, CancellationToken cancellationToken = default);
}

using Cusvya.Core.Template.Entities;

namespace Cusvya.Data.Template.Repositories;

public interface IUnitOfWork
{
    IRepository<User> Users { get; }
    IRepository<Customer> Customers { get; }
    IRepository<Setting> Settings { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}


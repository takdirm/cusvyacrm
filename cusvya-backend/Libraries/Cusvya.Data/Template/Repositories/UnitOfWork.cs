using Cusvya.Core.Template.Entities;

namespace Cusvya.Data.Template.Repositories;

public sealed class UnitOfWork(AppDbContext dbContext) : IUnitOfWork
{
    private Repository<User>? _users;
    private Repository<Customer>? _customers;
    private Repository<Setting>? _settings;

    public IRepository<User> Users => _users ??= new Repository<User>(dbContext);
    public IRepository<Customer> Customers => _customers ??= new Repository<Customer>(dbContext);
    public IRepository<Setting> Settings => _settings ??= new Repository<Setting>(dbContext);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}


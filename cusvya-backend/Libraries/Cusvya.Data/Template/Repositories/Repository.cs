using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;

namespace Cusvya.Data.Template.Repositories;

public sealed class Repository<TEntity>(AppDbContext dbContext) : IRepository<TEntity> where TEntity : class
{
    private readonly DbSet<TEntity> _dbSet = dbContext.Set<TEntity>();

    public Task<TEntity?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return _dbSet.FindAsync([id], cancellationToken).AsTask();
    }

    public Task<List<TEntity>> ListAsync(CancellationToken cancellationToken = default)
    {
        return _dbSet.AsNoTracking().ToListAsync(cancellationToken);
    }

    public Task<List<TEntity>> FindAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return _dbSet.Where(predicate).AsNoTracking().ToListAsync(cancellationToken);
    }

    public async Task<TEntity> AddAsync(TEntity entity, CancellationToken cancellationToken = default)
    {
        await _dbSet.AddAsync(entity, cancellationToken);
        return entity;
    }

    public void Update(TEntity entity)
    {
        _dbSet.Update(entity);
    }

    public void Remove(TEntity entity)
    {
        _dbSet.Remove(entity);
    }
}


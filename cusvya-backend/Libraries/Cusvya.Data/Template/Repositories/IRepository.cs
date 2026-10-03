using System.Linq.Expressions;

namespace Cusvya.Data.Template.Repositories;

public interface IRepository<TEntity> where TEntity : class
{
    Task<TEntity?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<TEntity>> ListAsync(CancellationToken cancellationToken = default);
    Task<List<TEntity>> FindAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default);
    Task<TEntity> AddAsync(TEntity entity, CancellationToken cancellationToken = default);
    void Update(TEntity entity);
    void Remove(TEntity entity);
}


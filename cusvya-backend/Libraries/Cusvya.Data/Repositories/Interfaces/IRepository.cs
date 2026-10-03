using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Scootr.Data.Repositories.Interfaces
{
    /// <summary>
    /// Generic repository interface for CRUD operations on entities
    /// </summary>
    /// <typeparam name="T">Entity type</typeparam>
    public interface IRepository<T> where T : class
    {
        // Query operations
        Task<T?> GetByIdAsync(int id);
        Task<IEnumerable<T>> GetAllAsync();
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);
        Task<bool> AnyAsync(Expression<Func<T, bool>> predicate);
        Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);

        // Query operations with includes
        Task<T?> GetByIdAsync(int id, params Expression<Func<T, object>>[] includes);
        Task<IEnumerable<T>> GetAllAsync(params Expression<Func<T, object>>[] includes);
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes);
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes);

        // Pagination
        Task<(IEnumerable<T> Items, int TotalCount)> GetPagedAsync(
            int pageNumber,
            int pageSize,
            Expression<Func<T, bool>>? predicate = null,
            Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
            params Expression<Func<T, object>>[] includes);

        // CRUD operations
        Task<T> AddAsync(T entity);
        Task<IEnumerable<T>> AddRangeAsync(IEnumerable<T> entities);
        Task<T> UpdateAsync(T entity);
        Task<IEnumerable<T>> UpdateRangeAsync(IEnumerable<T> entities);
        Task<bool> DeleteAsync(int id);
        Task<bool> DeleteAsync(T entity);
        Task<int> DeleteRangeAsync(IEnumerable<T> entities);
        Task<int> DeleteRangeAsync(Expression<Func<T, bool>> predicate);

        // Queryable for advanced scenarios
        IQueryable<T> Query();
        IQueryable<T> QueryNoTracking();
    }
}

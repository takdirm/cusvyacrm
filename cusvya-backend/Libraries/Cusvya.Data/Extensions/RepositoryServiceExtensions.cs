using Microsoft.Extensions.DependencyInjection;
using Scootr.Data.Repositories.Interfaces;
using Scootr.Data.Repositories.Implementation;

namespace Scootr.Data.Extensions
{
    /// <summary>
    /// Extension methods for registering repository services
    /// </summary>
    public static class RepositoryServiceExtensions
    {
        /// <summary>
        /// Registers the repository pattern services (Unit of Work and Generic Repository)
        /// </summary>
        /// <param name="services">The service collection</param>
        /// <returns>The service collection for chaining</returns>
        public static IServiceCollection AddRepositoryPattern(this IServiceCollection services)
        {
            // Register generic repository
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

            // Register unit of work
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            return services;
        }
    }
}

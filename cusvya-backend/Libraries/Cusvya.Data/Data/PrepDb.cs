
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Diagnostics;
using Scootr.Data;

namespace Scootr.Data
{
    public static class PrepDb
    {
        public static void PrepPopulation(IApplicationBuilder app, bool isProd)
        {
            using (var serviceScope = app.ApplicationServices.CreateScope())
            {
                SeedData(serviceScope.ServiceProvider.GetService<AppDbContext>(), isProd);
            }



        }

        private static void SeedData(AppDbContext context, bool isProd)
        {
            //if (isProd)
            //{
#if DEBUG
                Console.WriteLine("==========================================");
                Console.WriteLine("--> DATABASE MIGRATION STARTED");
                Console.WriteLine($"--> Timestamp: {DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}");
                Console.WriteLine("==========================================");
#else
                Console.WriteLine("--> Attempting to apply migrations...");
#endif

                var stopwatch = Stopwatch.StartNew();

                try
                {
#if DEBUG
                    Console.WriteLine("--> Checking database connection...");
                    var canConnect = context.Database.CanConnect();
                    Console.WriteLine($"--> Database connection status: {canConnect}");

                    if (!canConnect)
                    {
                        Console.WriteLine("--> ERROR: Cannot connect to database!");
                        return;
                    }

                    Console.WriteLine("--> Getting pending migrations...");
                    var pendingMigrations = context.Database.GetPendingMigrations().ToList();
                    Console.WriteLine($"--> Pending migrations count: {pendingMigrations.Count}");

                    if (pendingMigrations.Any())
                    {
                        Console.WriteLine("--> Pending migrations:");
                        foreach (var migration in pendingMigrations)
                        {
                            Console.WriteLine($"    - {migration}");
                        }
                    }
                    else
                    {
                        Console.WriteLine("--> No pending migrations. Database is up to date.");
                    }

                    Console.WriteLine("--> Getting applied migrations...");
                    var appliedMigrations = context.Database.GetAppliedMigrations().ToList();
                    Console.WriteLine($"--> Applied migrations count: {appliedMigrations.Count}");

                    Console.WriteLine("--> Starting migration process...");
                    Console.WriteLine($"--> Time elapsed: {stopwatch.ElapsedMilliseconds}ms");
#endif

                    context.Database.Migrate();

                    stopwatch.Stop();
#if DEBUG
                    Console.WriteLine("==========================================");
                    Console.WriteLine("--> MIGRATION COMPLETED SUCCESSFULLY");
                    Console.WriteLine($"--> Total time elapsed: {stopwatch.ElapsedMilliseconds}ms ({stopwatch.Elapsed.TotalSeconds:F2} seconds)");
                    Console.WriteLine($"--> Timestamp: {DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}");
                    Console.WriteLine("==========================================");
#else
                    Console.WriteLine($"--> Migrations completed successfully in {stopwatch.Elapsed.TotalSeconds:F2} seconds");
#endif
                }
                catch (Exception ex)
                {
                    stopwatch.Stop();
                    Console.WriteLine("==========================================");
                    Console.WriteLine("--> MIGRATION FAILED");
                    Console.WriteLine($"--> Time elapsed before failure: {stopwatch.ElapsedMilliseconds}ms");
                    Console.WriteLine($"--> Error: {ex.Message}");
#if DEBUG
                    Console.WriteLine($"--> Stack Trace: {ex.StackTrace}");
                    if (ex.InnerException != null)
                    {
                        Console.WriteLine($"--> Inner Exception: {ex.InnerException.Message}");
                        Console.WriteLine($"--> Inner Stack Trace: {ex.InnerException.StackTrace}");
                    }
#endif
                    Console.WriteLine("==========================================");
                }
            //}

            //if (!context.Stores.Any())
            //{
            //    Console.WriteLine("--> Seeding Data...");

            //    //context..AddRange(
            //    //    new Sale() { Name = "Bread", Quantity = 1 },
            //    //    new Sale() { Name = "Biscuits", Quantity = 10 },
            //    //    new Sale() { Name = "Rice", Quantity = 12 }
            //    //);

            //    //context.SaveChanges();
            //}
            //else
            //{
            //    Console.WriteLine("--> We already have data");
            //}
        }
    }
}

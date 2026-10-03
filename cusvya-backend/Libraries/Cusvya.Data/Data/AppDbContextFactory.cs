using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;

namespace Scootr.Data
{
    public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            string currentDirectory = Directory.GetCurrentDirectory();
            string[] configCandidates =
            {
                Path.Combine(currentDirectory, "conf", "appsettings.json"),
                Path.Combine(currentDirectory, "..", "..", "conf", "appsettings.json"),
                Path.Combine(AppContext.BaseDirectory, "conf", "appsettings.json")
            };

            string? configPath = null;
            foreach (var candidate in configCandidates)
            {
                if (File.Exists(candidate))
                {
                    configPath = candidate;
                    break;
                }
            }

            if (string.IsNullOrWhiteSpace(configPath))
            {
                throw new FileNotFoundException("Unable to locate conf/appsettings.json for design-time DbContext creation.");
            }

            var configuration = new ConfigurationBuilder()
                .SetBasePath(Path.GetDirectoryName(configPath)!)
                .AddJsonFile(Path.GetFileName(configPath), optional: false, reloadOnChange: true)
                .Build();

            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
            optionsBuilder.UseSqlServer(configuration.GetConnectionString("DBConnString"));

            return new AppDbContext(optionsBuilder.Options);
        }
    }
}

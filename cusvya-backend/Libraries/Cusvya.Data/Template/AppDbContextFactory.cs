using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Cusvya.Data.Template;

public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var basePath = Directory.GetCurrentDirectory();
        var rootConfigPath = Path.Combine(basePath, "conf", "appsettings.json");
        var apiConfigPath = Path.Combine(basePath, "Presentation", "CusvyaApi", "conf", "appsettings.json");

        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile(File.Exists(apiConfigPath) ? apiConfigPath : rootConfigPath, optional: true)
            .Build();

        var envConnection = Environment.GetEnvironmentVariable("CUSVYA_DB_CONNECTION");
        var connectionString = !string.IsNullOrWhiteSpace(envConnection)
            ? envConnection
            : configuration.GetConnectionString("DBConnString")
                ?? "Server=localhost;Database=Cusvya;Integrated Security=True;TrustServerCertificate=True";

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseSqlServer(connectionString);
        return new AppDbContext(optionsBuilder.Options);
    }
}

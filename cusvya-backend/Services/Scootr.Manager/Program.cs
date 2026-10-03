using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Scootr.Data;
using Scootr.Data.Mapper;
using Scootr.Data.Repositories.Implementation;
using Scootr.Data.Repositories.Interfaces;
using Scootr.Data.Services.Billings;
using Scootr.Data.Services.Caching;
using Scootr.Data.Services.Customers;
using Scootr.Data.Services.Documents;
using Scootr.Data.Services.Gprs;
using Scootr.Data.Services.Notifications;
using Scootr.Data.Services.Payments;
using Scootr.Data.Services.Plans;
using Scootr.Data.Services.Pricing;
using Scootr.Data.Services.Regions;
using Scootr.Data.Services.Settings;
using Scootr.Data.Services.Stations;
using Scootr.Data.Services.Twilio;
using Scootr.Data.Services.Vehicles;
using Scootr.Manager.Service;
using Scootr.Services.Arrears;
using Scootr.Services.Billings;

namespace Scootr.Manager;

public class Program
{
    public static void Main(string[] args)
    {
        Console.WriteLine("=========================================");
        Console.WriteLine("Starting Scootr Manager Service...");
        Console.WriteLine("=========================================");

        try
        {
            CreateHostBuilder(args).Build().Run();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Application failed to start: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw;
        }
    }

    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .UseContentRoot(AppContext.BaseDirectory)
            .ConfigureAppConfiguration((hostingContext, config) =>
            {
                // Clear default configuration sources to ensure clean slate
                config.Sources.Clear();

                // Add environment variables
                config.AddEnvironmentVariables();

                // Load appsettings from conf directory if it exists
                var appSettingFilePath = Path.Combine(
                    AppContext.BaseDirectory, "conf", "appsettings.json");

                Console.WriteLine($"Looking for config at: {appSettingFilePath}");
                Console.WriteLine($"File exists: {File.Exists(appSettingFilePath)}");

                if (File.Exists(appSettingFilePath))
                {
                    config.AddJsonFile(appSettingFilePath, optional: false, reloadOnChange: true);
                    Console.WriteLine("✓ Configuration file loaded");
                }
                else
                {
                    Console.WriteLine("WARNING: Configuration file not found!");
                }
            })
            .ConfigureServices((hostContext, services) =>
            {
                // Database Context
                var connectionString = hostContext.Configuration.GetConnectionString("DBConnString");

                if (string.IsNullOrEmpty(connectionString))
                {
                    throw new InvalidOperationException("Database connection string 'DBConnString' is not configured. Please check conf/appsettings.json");
                }

                Console.WriteLine($"✓ Connection string loaded: {connectionString.Substring(0, Math.Min(50, connectionString.Length))}...");

                services.AddDbContext<AppDbContext>(options =>
                    options.UseSqlServer(connectionString));

                // HTTP Client Factory
                services.AddHttpClient();

                // Repository Pattern
                services.AddScoped<IUnitOfWork, UnitOfWork>();
                services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

                // AutoMapper
                services.AddAutoMapper(typeof(MappingProfile));

                // Distributed SQL Server Cache for Settings
                services.AddDistributedSqlServerCache(options =>
                {
                    options.ConnectionString = connectionString;
                    options.SchemaName = "dbo";
                    options.TableName = "ScootrCaching";
                });

                // Caching Service
                services.AddScoped<ICachingService, CachingService>();

                // Register Services with Scoped lifetime for database operations
                services.AddScoped<IGprsService, GprsService>();
                services.AddScoped<INotificationService, NotificationService>();
                services.AddScoped<IBookingService, BookingService>();
                services.AddScoped<ISettingsService, SettingsService>();
                services.AddScoped<ICustomerService, CustomerService>();
                services.AddScoped<IStationService, StationService>();
                services.AddScoped<IVehicleService, VehicleService>();
                services.AddScoped<ICatalogueService, CatalogueService>();
                services.AddScoped<IGprsService, GprsService>();
                services.AddScoped<IRegionContext, RegionContext>();
                services.AddScoped<IPlanService, PlanService>();
                services.AddScoped<IBookingService, BookingService>();
                services.AddScoped<IForecastPricingService, ForecastPricingService>();
                services.AddScoped<PostpaidBillingService>();
                services.AddScoped<WalletBillingService>();
                services.AddScoped<BillingServiceFactory>();
                services.AddScoped<ITwilioService, TwilioService>();
                services.AddScoped<IPaymentService, PaymentServiceImpl>();
                services.AddScoped<IInvoiceService, InvoiceServiceImpl>();
                services.AddScoped<ICustomerWalletService, CustomerWalletService>();
                services.AddScoped<IPaymentOrderService, PaymentOrderService>();
                services.AddScoped<IRazorPayService, RazorPayService>();
                services.AddScoped<IArrearsService, ArrearsServiceImpl>();
                services.AddScoped<IFcmNotificationService, FirebaseFcmNotificationService>();
                services.AddScoped<IDocumentService, DocumentService>();
                services.AddScoped<IOwnershipFulfilmentService,OwnershipFulfilmentService>();
                
                // Register Job Service with dependencies
                services.AddScoped<IScootrJobService, ScootrJobService>();

                // Register the background worker service
                services.AddHostedService<ScootrWorker>();

                Console.WriteLine("✓ Services registered successfully");
            })
            .ConfigureLogging((hostingContext, logging) =>
            {
                // Clear default logging providers
                logging.ClearProviders();

                // Create logs directory
                var logPath = Path.Combine(AppContext.BaseDirectory, "logs");
                Directory.CreateDirectory(logPath);

                // Add log4net
                var log4netConfigPath = Path.Combine(AppContext.BaseDirectory, "log4net.manager.config");
                Console.WriteLine($"✓ Log4net config: {log4netConfigPath}");
                Console.WriteLine($"✓ Log file will be created at: {Path.Combine(logPath, "ScootrManager.log")}");

                logging.AddLog4Net(log4netConfigPath);

                // Suppress verbose EF Core logging
                logging.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.Warning);
                logging.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.Warning);
                logging.AddFilter("Microsoft", LogLevel.Warning);
                logging.AddFilter("System", LogLevel.Warning);
            })
            // Enable Windows Service support
            .UseWindowsService(options =>
            {
                options.ServiceName = "ScootrManager";
            })
            // Enable Linux systemd support
            .UseSystemd();
}


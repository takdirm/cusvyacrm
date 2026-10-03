// Program.cs
using System;
using System.IO;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using AutoMapper;
using GprsServer.Handlers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Scootr.Data;
using Scootr.Data.Mapper;
using Scootr.Data.Repositories.Implementation;
using Scootr.Data.Repositories.Interfaces;
using Scootr.Data.Services.Gprs;

namespace GprsServer
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("=========================================");
            Console.WriteLine("Starting GPRS Server...");
            Console.WriteLine("=========================================");

            // Configure logging
            ConfigureLogging();

            IConfiguration configuration = BuildConfiguration();
            ServiceProvider serviceProvider = BuildServiceProvider(configuration);

            var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("=========================================");
            logger.LogInformation("GPRS Server Started Successfully");
            logger.LogInformation("=========================================");

            var serverLogger = serviceProvider.GetRequiredService<ILogger<Server>>();
            var server = new Server(8181, serviceProvider.GetRequiredService<IServiceScopeFactory>(), serverLogger, configuration);
            logger.LogInformation("Server instance created on port 8181");
            server.Start();
            logger.LogInformation("Server started and listening for connections");
            StartCommandApi(server, configuration);
            logger.LogInformation("Command API started");

            Console.WriteLine("Commands: 'off'/'on' (active client), 'off <imeiOrClientId>'/'on <imeiOrClientId>', 'quit'");
            logger.LogInformation("Interactive command mode ready");

            while (true)
            {
                Console.Write("> ");
                string? raw = Console.ReadLine()?.Trim();
                if (string.IsNullOrWhiteSpace(raw))
                {
                    continue;
                }

                string[] parts = raw.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                string command = parts[0].ToLowerInvariant();
                string? identifier = parts.Length > 1 ? parts[1].Trim() : null;

                switch (command)
                {
                    case "off":
                        if (string.IsNullOrWhiteSpace(identifier))
                        {
                            server.SendEngineOff();
                        }
                        else
                        {
                            server.SendEngineOff(identifier);
                        }
                        break;
                    case "on":
                        if (string.IsNullOrWhiteSpace(identifier))
                        {
                            server.SendEngineOn();
                        }
                        else
                        {
                            server.SendEngineOn(identifier);
                        }
                        break;
                    case "quit":
                    case "exit":
                        return;
                    default:
                        Console.WriteLine("Unknown command. Use: off | on | off <id> | on <id> | quit");
                        break;
                }
            }
        }

        private static void ConfigureLogging()
        {
            // Create logs directory if it doesn't exist
            var logPath = Path.Combine(AppContext.BaseDirectory, "logs");
            Directory.CreateDirectory(logPath);

            // Configure log4net
            var log4netConfigPath = Path.Combine(AppContext.BaseDirectory, "log4net.gprs.config");
            var logRepository = log4net.LogManager.GetRepository(System.Reflection.Assembly.GetEntryAssembly());
            log4net.Config.XmlConfigurator.Configure(logRepository, new FileInfo(log4netConfigPath));

            Console.WriteLine($"✓ Log4net configured: {log4netConfigPath}");
            Console.WriteLine($"✓ Log file will be created at: {Path.Combine(logPath, "GprsServer.log")}");
        }

        private static IConfiguration BuildConfiguration()
        {
            return new ConfigurationBuilder()
                .SetBasePath(AppContext.BaseDirectory)
                .AddJsonFile("conf/appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile(Path.Combine(AppContext.BaseDirectory, "appsettings.json"), optional: true, reloadOnChange: true)
                .Build();
        }

        private static void StartCommandApi(Server server, IConfiguration configuration)
        {
            string baseUrl = configuration.GetValue<string>("GprsServer:CommandApiUrl") ?? "http://localhost:8182/";
            if (!baseUrl.EndsWith("/", StringComparison.Ordinal))
            {
                baseUrl += "/";
            }

            var listener = new HttpListener();
            listener.Prefixes.Add(baseUrl);
            listener.Start();

            Console.WriteLine($"GPRS command API listening on {baseUrl}");

            _ = Task.Run(async () =>
            {
                while (listener.IsListening)
                {
                    HttpListenerContext context;
                    try
                    {
                        context = await listener.GetContextAsync();
                    }
                    catch
                    {
                        break;
                    }

                    try
                    {
                        if (context.Request.HttpMethod != "POST")
                        {
                            context.Response.StatusCode = (int)HttpStatusCode.MethodNotAllowed;
                            await WriteJsonAsync(context.Response, new { message = "Use POST." });
                            continue;
                        }

                        string path = context.Request.Url?.AbsolutePath?.TrimEnd('/').ToLowerInvariant() ?? string.Empty;
                        string identifier = context.Request.QueryString["identifier"] ?? string.Empty;
                        bool ok = path switch
                        {
                            "/engine/off" => string.IsNullOrWhiteSpace(identifier)
                                ? server.SendEngineOff()
                                : server.SendEngineOff(identifier),
                            "/engine/on" => string.IsNullOrWhiteSpace(identifier)
                                ? server.SendEngineOn()
                                : server.SendEngineOn(identifier),
                            _ => false
                        };

                        if (path != "/engine/off" && path != "/engine/on")
                        {
                            context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                            await WriteJsonAsync(context.Response, new { message = "Unknown endpoint." });
                            continue;
                        }

                        context.Response.StatusCode = ok ? (int)HttpStatusCode.OK : (int)HttpStatusCode.NotFound;
                        await WriteJsonAsync(context.Response, new
                        {
                            identifier,
                            success = ok,
                            action = path == "/engine/off" ? "EngineOff" : "EngineOn"
                        });
                    }
                    catch (Exception ex)
                    {
                        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                        await WriteJsonAsync(context.Response, new { message = ex.Message });
                    }
                }
            });
        }

        private static async Task WriteJsonAsync(HttpListenerResponse response, object payload)
        {
            response.ContentType = "application/json";
            string json = JsonSerializer.Serialize(payload);
            byte[] bytes = Encoding.UTF8.GetBytes(json);
            response.ContentLength64 = bytes.Length;
            await response.OutputStream.WriteAsync(bytes, 0, bytes.Length);
            response.OutputStream.Close();
        }

        private static ServiceProvider BuildServiceProvider(IConfiguration configuration)
        {
            string? connectionString = configuration.GetConnectionString("DBConnString");
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException("DB connection string 'DBConnString' was not found.");
            }

            var maskedConnectionString = connectionString.Substring(0, Math.Min(50, connectionString.Length)) + "...";
            Console.WriteLine($"✓ Connection string loaded: {maskedConnectionString}");

            var services = new ServiceCollection();
            services.AddSingleton(configuration);
            services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(connectionString));
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped<IGprsService, GprsService>();
            services.AddAutoMapper(typeof(MappingProfile));

            // Register all packet handlers
            services.AddTransient<LoginHandler>();
            services.AddTransient<HeartbeatHandler>();
            services.AddTransient<LocationHandler>();
            services.AddTransient<CommandReplyHandler>();
            services.AddTransient<ExtendedHeartbeatHandler>();
            services.AddTransient<AlarmHandler>();
            services.AddTransient<StringInformationHandler>();

            // Add logging with log4net
            services.AddLogging(builder =>
            {
                builder.ClearProviders();
                var log4netConfigPath = Path.Combine(AppContext.BaseDirectory, "log4net.gprs.config");
                Console.WriteLine($"✓ Loading log4net config from: {log4netConfigPath}");
                builder.AddLog4Net(log4netConfigPath);

                // Suppress verbose logging
                builder.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.Warning);
                builder.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.Warning);
                builder.AddFilter("Microsoft", LogLevel.Warning);
                builder.AddFilter("System", LogLevel.Warning);
            });

            Console.WriteLine("✓ Services and logging registered successfully");

            return services.BuildServiceProvider();
        }
    }
}

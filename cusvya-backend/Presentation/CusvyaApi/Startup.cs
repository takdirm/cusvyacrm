using AutoMapper;
using CachingFramework.Redis;
using CachingFramework.Redis.Contracts;
using CachingFramework.Redis.Serializers;
using Firebase.Auth;
using Firebase.Auth.Providers;
using FirebaseAdmin;
using FirebaseAdmin.Auth;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Scootr.Core;
using Scootr.Core.Domain.Settings;
using Scootr.Core.Helpers;
using Scootr.Core.Infrastructure;
using Scootr.Data;
using Scootr.Data.Authentication;
using Scootr.Data.Mapper;
using Scootr.Data.Services.Authentication;
using Scootr.Data.Services.Billings;
using Scootr.Services.Billings;
using Scootr.Data.Services.Caching;
using Scootr.Data.Services.Notifications;
using Scootr.Data.Services.Customers;
using Scootr.Data.Services.Firebase;
using Scootr.Data.Services.Users;
using Scootr.Data.Services.Payments;
using Scootr.Data.Services.Settings;
using Scootr.Data.Services.Twilio;
using Scootr.Data.Services.Stations;
using Scootr.Data.Services.Plans;
using Scootr.Data.Services.Vehicles;
using Scootr.Data.Services.Vendors;
using Scootr.Data.Services.Gprs;
using Scootr.Data.Services.Pricing;
using Scootr.Data.Services.Trackers;
using Scootr.Services.Arrears;
using Scootr.Data.Services.Documents;
using Scootr.Data.Services.Dashboard;
using Scootr.Data.Services.Regions;
using ScootrApi.Middleware;
using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using Scootr.Data.Repositories.Interfaces;
using Scootr.Data.Repositories.Implementation;

namespace ScootrApi
{
    public class Startup
    {
        public IConfiguration Configuration { get; }
        private readonly IWebHostEnvironment _env;
        public Startup(IConfiguration configuration, IWebHostEnvironment env)
        {
            Configuration = configuration;
            _env = env;
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // Database configuration
            services.AddDbContext<AppDbContext>(opt =>
            {
                opt.UseSqlServer(
                    Configuration.GetConnectionString("DBConnString"),
                    sqlOptions => sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 3,
                        maxRetryDelay: TimeSpan.FromSeconds(5),
                        errorNumbersToAdd: null));

#if DEBUG
                // Enable detailed EF Core logging for migrations (DEBUG mode only)
                opt.LogTo(Console.WriteLine, new[] {
                    Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.CommandExecuting,
                    Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.CommandExecuted,
                    Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.CommandError,
                    Microsoft.EntityFrameworkCore.Diagnostics.CoreEventId.ContextInitialized
                }, Microsoft.Extensions.Logging.LogLevel.Information);

                opt.EnableSensitiveDataLogging();
                opt.EnableDetailedErrors();
#endif
            });
            string redisConnectionString = Configuration.GetValue<string>("RedisConfig:ConnectionString");
            services.AddSingleton<IContext>(s => new RedisContext(redisConnectionString, new JsonSerializer()));


            // Services
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

            services.AddScoped<IScootrFileProvider, ScootrFileProvider>();
            services.AddScoped<ISettingsService, SettingsService>();
            var typeFinder = new AppDomainTypeFinder();
            services.AddSingleton<ITypeFinder>(typeFinder);
            services.AddScoped<IHttpClientHelper<HttpResponseMessage>, HttpClientHelper<HttpResponseMessage>>();
            services.AddScoped<IAuthService, AuthService>();

            // Firebase User Management
            services.AddScoped<IFirebaseUserManagementService, FirebaseUserManagementService>();

            // User Service with Firebase sync
            services.AddScoped<IUserService, UserService>();

            // Current User Service
            services.AddHttpContextAccessor();
            services.AddScoped<ICurrentUserService, CurrentUserService>();
            services.AddScoped<IRegionContext, RegionContext>();

            services.AddScoped<ICustomerService, CustomerService>();
            services.AddScoped<IStationService, StationService>();
            services.AddScoped<IVehicleService, VehicleService>();
            services.AddScoped<IOwnershipFulfilmentService, OwnershipFulfilmentService>();
            services.AddScoped<IVendorService, VendorService>();
            services.AddScoped<IAccessorieService, AccessorieService>();
            services.AddScoped<ITrackerService, TrackerService>();
            services.AddScoped<ICatalogueService, CatalogueService>();
            services.AddScoped<IGprsService, GprsService>();
            services.AddScoped<IPlanService, PlanService>();
            services.AddScoped<IBookingService, BookingService>();
            services.AddScoped<IBookingControlService, BookingControlService>();
            services.AddScoped<IDashboardService, DashboardService>();
            services.AddScoped<IForecastPricingService, ForecastPricingService>();
            services.AddScoped<PostpaidBillingService>();
            services.AddScoped<WalletBillingService>();
            services.AddScoped<BillingServiceFactory>();
            services.AddScoped<ITwilioService, TwilioService>();
            services.AddScoped<INotificationService, NotificationService>();
            services.AddScoped<IFcmNotificationService, FirebaseFcmNotificationService>();
            services.AddScoped<IPaymentService, PaymentServiceImpl>();
            services.AddScoped<IInvoiceService, InvoiceServiceImpl>();
            services.AddScoped<ICustomerWalletService, CustomerWalletService>();
            services.AddScoped<IPaymentOrderService, PaymentOrderService>();
            services.AddScoped<IRazorPayService, RazorPayService>();
            services.AddScoped<IArrearsService, ArrearsServiceImpl>();
            services.AddScoped<IDocumentService, DocumentService>();
            // Swagger
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
                {
                    Title = "Scootr API",
                    Version = "v1",
                    Description = "API documentation for Scootr",
                });

                // VehicleController exposes JSON and multipart variants on the same route.
                // Resolve duplicate method/path collisions so Swagger does not throw at runtime.
                c.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());

                // Add JWT Bearer authentication to Swagger
                c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                    Description = "Enter your Firebase ID token obtained after authentication"
                });

                c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
                {
                    {
                        new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                        {
                            Reference = new Microsoft.OpenApi.Models.OpenApiReference
                            {
                                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            // AutoMapper
            services.AddAutoMapper(typeof(MappingProfile));

            // Controllers
            services.AddControllers();

            // CORS - allow all origins for mobile and web clients
            // Mobile apps (React Native) don't send Origin headers and bypass CORS
            // Web browsers need CORS headers, so we allow any origin since JWT handles security
            services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", builder =>
                {
                    builder
                        .AllowAnyOrigin()  // Mobile apps + web clients (any origin)
                        .AllowAnyMethod()  // GET, POST, PUT, DELETE, etc.
                        .AllowAnyHeader()  // Content-Type, Authorization, etc.
                        .SetPreflightMaxAge(TimeSpan.FromSeconds(3600)); // Cache preflight 1 hour
                });
            });

            // Firebase
            services.AddSingleton<IFirebaseAuthService, FirebaseAuthService>();

            var firebaseCredentialsPath = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");
            if (string.IsNullOrWhiteSpace(firebaseCredentialsPath))
            {
                firebaseCredentialsPath = Configuration["Firebase:ServiceAccountFilePath"];
                if (!string.IsNullOrWhiteSpace(firebaseCredentialsPath))
                {
                    Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", firebaseCredentialsPath);
                }
            }

            if (string.IsNullOrWhiteSpace(firebaseCredentialsPath) || !File.Exists(firebaseCredentialsPath))
            {
                throw new InvalidOperationException("Firebase credentials are not configured. Set GOOGLE_APPLICATION_CREDENTIALS or Firebase:ServiceAccountFilePath to a valid service account JSON file path.");
            }

            var firebaseCredentialJson = File.ReadAllText(firebaseCredentialsPath);
            using var firebaseCredentialDocument = System.Text.Json.JsonDocument.Parse(firebaseCredentialJson);
            if (!firebaseCredentialDocument.RootElement.TryGetProperty("project_id", out var firebaseProjectIdElement)
                || string.IsNullOrWhiteSpace(firebaseProjectIdElement.GetString()))
            {
                throw new InvalidOperationException("Firebase service account file does not contain a valid project_id.");
            }

            var firebaseProjectName = firebaseProjectIdElement.GetString();

            // Initialize Firebase Admin SDK
            if (FirebaseApp.DefaultInstance == null)
            {
                var credential = GoogleCredential.GetApplicationDefault();

                services.AddSingleton(
                    FirebaseApp.Create(new AppOptions
                    {
                        Credential = credential,
                        ProjectId = firebaseProjectName
                    })
                );
            }

            // HttpClient for Prepaid (example)
            services.AddHttpClient("RazorPay", client =>
            {
                client.BaseAddress = new Uri("https://api.github.com/");
                client.DefaultRequestHeaders.Add("Accept", "application/vnd.github.v3+json");
            });

            // Firebase Auth Client
            services.AddSingleton(new FirebaseAuthClient(new FirebaseAuthConfig
            {
                ApiKey = "AIzaSyDIndXK9bWTn4iRYrj4ZgFJbVIQWPgaXCg",
                AuthDomain = $"{firebaseProjectName}.firebaseapp.com",
                Providers = new FirebaseAuthProvider[]
                {
                    new EmailProvider(),
                    new GoogleProvider()
                }
            }));

            // JWT Authentication with Firebase token support
            services.AddAuthentication(options =>
            {
                // Set Firebase as the default authentication scheme
                options.DefaultAuthenticateScheme = "Firebase";
                options.DefaultChallengeScheme = "Firebase";
            })
            .AddScheme<AuthenticationSchemeOptions, FirebaseAuthenticationHandler>("Firebase", options => { })
            .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.Authority = $"https://securetoken.google.com/{firebaseProjectName}";
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = $"https://securetoken.google.com/{firebaseProjectName}",
                    ValidateAudience = true,
                    ValidAudience = firebaseProjectName,
                    ValidateLifetime = true
                };
            });

            // AppSettings for DI
            services.Configure<AppSettings>(Configuration);
            services.AddSingleton(resolver => resolver.GetRequiredService<Microsoft.Extensions.Options.IOptions<AppSettings>>().Value);

            // Register all settings dynamically
            using (var serviceProvider = services.BuildServiceProvider())
            {
                var typeFinderInstance = serviceProvider.GetRequiredService<ITypeFinder>();
                var settingsTypes = typeFinderInstance.FindClassesOfType(typeof(ISettings), false).ToList();
                foreach (var settingType in settingsTypes)
                {
                    services.AddScoped(settingType, serviceProvider =>
                    {
                        return serviceProvider.GetRequiredService<ISettingsService>().LoadSettingAsync(settingType).Result;
                    });
                }
            }

            services.AddDistributedSqlServerCache(options =>
            {
                options.ConnectionString = Configuration.GetConnectionString("DBConnString");
                options.SchemaName = "dbo";
                options.TableName = "ScootrCaching";
            });
            services.AddScoped<ICachingService, CachingService>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILoggerFactory loggerFactory)
        {
            //if (env.IsDevelopment())
            //{
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Scootr API V1");
                    c.RoutePrefix = string.Empty;
                });
               // app.UseDeveloperExceptionPage();
            //}

            app.Use(async (context, next) =>
            {
                if (context.Request.Path == "/")
                {
                    context.Response.Redirect("/swagger/index.html");
                    return;
                }
                await next();
            });

            loggerFactory.AddLog4Net();

            // Enable static files from wwwroot
            app.UseStaticFiles();

            // Optional: Enable serving files from specific directory with custom request path
            var modelsPath = Path.Combine(env.WebRootPath, "models");
            if (!Directory.Exists(modelsPath))
            {
                Directory.CreateDirectory(modelsPath);
            }

            // app.UseHttpsRedirection();
            app.UseRouting();

            // Populate request-scoped region context before authentication and business services.
            app.UseRegionContext();

            // Authentication error handling middleware - handles 401/403 responses
            app.UseAuthenticationErrorHandling();

            // Apply CORS policy - must come before UseAuthentication
            // This handles all CORS including OPTIONS preflight automatically
            app.UseCors("AllowAll");

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });

            PrepDb.PrepPopulation(app, env.IsProduction());
        }
    }
}

using Cusvya.Data.Template.Repositories;
using Cusvya.Services.Template.Auth;
using Cusvya.Services.Template.Customers;
using Cusvya.Services.Template.Settings;
using Cusvya.Services.Template.Users;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Cusvya.Services.Template;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCusvyaServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<FirebaseOptions>(configuration.GetSection(FirebaseOptions.SectionName));

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ISettingService, SettingService>();
        services.AddSingleton<IFirebaseTokenVerifier, FirebaseTokenVerifier>();
        return services;
    }
}


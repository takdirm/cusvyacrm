using Cusvya.Api.Template.Auth;
using Cusvya.Api.Template.Middleware;
using Cusvya.Data.Template;
using Cusvya.Services.Template;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

var projectConfigPath = Path.Combine(builder.Environment.ContentRootPath, "conf", "appsettings.json");
var deployedConfigPath = Path.Combine(AppContext.BaseDirectory, "conf", "appsettings.json");
var rootConfigPath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "..", "..", "conf", "appsettings.json"));

var selectedConfigPath = File.Exists(projectConfigPath)
    ? projectConfigPath
    : File.Exists(deployedConfigPath)
        ? deployedConfigPath
        : rootConfigPath;

builder.Configuration.AddJsonFile(selectedConfigPath, optional: false, reloadOnChange: true);
const string corsPolicyName = "CusvyaCors";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        if (allowedOrigins.Length == 0 || allowedOrigins.Contains("*"))
        {
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
            return;
        }

        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
    });
});
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Cusvya API Template",
        Version = "v1",
        Description = "Reusable .NET 8 API template with Firebase authentication."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Firebase ID token in the format: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DBConnString");
    options.UseSqlServer(connectionString);
});

builder.Services.AddCusvyaServices(builder.Configuration);

builder.Services
    .AddAuthentication("Firebase")
    .AddScheme<AuthenticationSchemeOptions, FirebaseAuthenticationHandler>("Firebase", _ => { });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("UserOnly", policy => policy.RequireClaim("app_type", "user"));
    options.AddPolicy("CustomerOnly", policy => policy.RequireClaim("app_type", "customer"));
    options.AddPolicy("UserOrCustomer", policy => policy.RequireClaim("app_type", "user", "customer"));
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseCors(corsPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

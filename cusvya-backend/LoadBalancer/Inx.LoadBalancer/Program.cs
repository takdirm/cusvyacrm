using System.Security.Cryptography.X509Certificates;

Console.WriteLine("=========================================");
Console.WriteLine("Starting FSB Load Balancer...");
Console.WriteLine("=========================================");

var builder = WebApplication.CreateBuilder(args);

// Configure logging
builder.Logging.ClearProviders();

// Create logs directory
var logPath = Path.Combine(AppContext.BaseDirectory, "logs");
Directory.CreateDirectory(logPath);

// Add log4net
var log4netConfigPath = Path.Combine(AppContext.BaseDirectory, "log4net.balancer.config");
Console.WriteLine($"✓ Log4net config: {log4netConfigPath}");
Console.WriteLine($"✓ Log file will be created at: {Path.Combine(logPath, "LoadBalancer.log")}");

builder.Logging.AddLog4Net(log4netConfigPath);

// Suppress verbose logging
builder.Logging.AddFilter("Microsoft", LogLevel.Warning);
builder.Logging.AddFilter("System", LogLevel.Warning);
builder.Logging.AddFilter("Yarp", LogLevel.Warning);

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(80);

    var certPath = Environment.GetEnvironmentVariable("LETS_ENCRYPT_CERT_PATH");
    var keyPath = Environment.GetEnvironmentVariable("LETS_ENCRYPT_KEY_PATH");

    if (!string.IsNullOrWhiteSpace(certPath) && !string.IsNullOrWhiteSpace(keyPath) && File.Exists(certPath) && File.Exists(keyPath))
    {
        Console.WriteLine($"✓ SSL certificate found, enabling HTTPS on port 443");
        Console.WriteLine($"  Certificate: {certPath}");
        Console.WriteLine($"  Private Key: {keyPath}");

        // Read fullchain.pem (leaf + intermediates) and private key
        var certPem = File.ReadAllText(certPath);
        var keyPem = File.ReadAllText(keyPath);

        // Create certificate with full chain + private key
        // This combines the fullchain.pem with the private key
        var certificateWithKey = X509Certificate2.CreateFromPem(certPem, keyPem);

        options.ListenAnyIP(443, listenOptions => 
        {
            listenOptions.UseHttps(httpsOptions =>
            {
                httpsOptions.ServerCertificate = certificateWithKey;

                // CRITICAL: Attach the full certificate chain explicitly
                httpsOptions.ServerCertificateChain = new X509Certificate2Collection();
                httpsOptions.ServerCertificateChain.ImportFromPem(certPem);

                Console.WriteLine($"✓ HTTPS configured with {httpsOptions.ServerCertificateChain.Count}-certificate chain");
                for (int i = 0; i < httpsOptions.ServerCertificateChain.Count; i++)
                {
                    Console.WriteLine($"    [{i}] {httpsOptions.ServerCertificateChain[i].Subject}");
                }
            });
        });
    }
    else
    {
        Console.WriteLine("⚠ SSL certificate not found, HTTPS disabled");
    }
});

builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxyConfig"));

var app = builder.Build();

var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Load Balancer application started successfully");
logger.LogInformation("Reverse proxy configured and ready");

app.MapReverseProxy();

app.Run();


using Scootr.Manager.Service;

namespace Scootr.Manager;

/// <summary>
/// Cross-platform background worker service that executes scheduled tasks every 20 seconds.
/// This service runs as a Windows Service or Linux systemd daemon.
/// </summary>
public class ScootrWorker : BackgroundService
{
    private readonly ILogger<ScootrWorker> _logger;
    private readonly IConfiguration _configuration;
    private readonly IServiceProvider _serviceProvider;
    private int _executionCount = 0;
    private int _failureCount = 0;

    public ScootrWorker(
        ILogger<ScootrWorker> logger, 
        IConfiguration configuration,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _configuration = configuration;
        _serviceProvider = serviceProvider;
    }

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("======================================");
        _logger.LogInformation("Scootr Worker Service is STARTING");
        _logger.LogInformation("======================================");
        Console.WriteLine("======================================");
        Console.WriteLine("Scootr Worker Service is STARTING");
        Console.WriteLine("======================================");
        return base.StartAsync(cancellationToken);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Scootr Worker Service ExecuteAsync started at: {time}", DateTimeOffset.Now);
        Console.WriteLine($"Scootr Worker Service ExecuteAsync started at: {DateTimeOffset.Now}");

        // Get polling interval from configuration (default 20 seconds)
        var pollingInterval = _configuration.GetValue<int>("ScootrWorker:PollingIntervalSeconds", 20);
        var enabled = _configuration.GetValue<bool>("ScootrWorker:Enabled", true);

        if (!enabled)
        {
            _logger.LogWarning("Scootr Worker is DISABLED in configuration. Exiting.");
            Console.WriteLine("Scootr Worker is DISABLED in configuration.");
            return;
        }

        _logger.LogInformation("Polling interval set to: {interval} seconds", pollingInterval);
        Console.WriteLine($"Polling interval set to: {pollingInterval} seconds");

        // Run every N seconds (default 20)
        using PeriodicTimer timer = new PeriodicTimer(TimeSpan.FromSeconds(pollingInterval));

        try
        {
            // Execute immediately on startup, then wait for timer
            await DoWorkAsync(stoppingToken);

            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                await DoWorkAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Scootr Worker Service is stopping (cancellation requested).");
            Console.WriteLine("Scootr Worker Service is stopping.");
        }
        catch (Exception ex)
        {
            // Log the error but don't crash the service
            _logger.LogCritical(ex, "FATAL ERROR in ExecuteAsync main loop. Service stopping.");
            Console.WriteLine($"FATAL ERROR: {ex.Message}");
            throw; // Let the host know something went really wrong
        }
    }

    private async Task DoWorkAsync(CancellationToken cancellationToken)
    {
        try
        {
            _executionCount++;

            var message = $"Scootr Job Service - Execution #{_executionCount} started at: {DateTimeOffset.Now:yyyy-MM-dd HH:mm:ss}";
            _logger.LogInformation(message);
            Console.WriteLine(message);

            // Create a scope for scoped services
            using (var scope = _serviceProvider.CreateScope())
            {
                var jobService = scope.ServiceProvider.GetRequiredService<IScootrJobService>();

                // Execute all scheduled jobs
                await jobService.ExecuteAsync(cancellationToken);
            }

            var completedMessage = $"Scootr Job Service - Execution #{_executionCount} completed at: {DateTimeOffset.Now:yyyy-MM-dd HH:mm:ss}";
            _logger.LogInformation(completedMessage);
            Console.WriteLine(completedMessage);
        }
        catch (Exception ex)
        {
            // IMPORTANT: Catch exceptions here to prevent service shutdown
            _failureCount++;
            _logger.LogError(ex, "ERROR in DoWorkAsync (Execution #{ExecutionCount}, Failure #{FailureCount}): {ErrorMessage}",
                _executionCount, _failureCount, ex.Message);
            Console.WriteLine($"ERROR in DoWorkAsync: {ex.Message}");

            // Service continues running even after exception
        }
    }

    public override async Task StopAsync(CancellationToken stoppingToken)
    {
        var message = $"Scootr Worker Service is STOPPING. Total executions: {_executionCount}, Total failures: {_failureCount}";
        _logger.LogInformation(message);
        Console.WriteLine("======================================");
        Console.WriteLine(message);
        Console.WriteLine("======================================");

        await base.StopAsync(stoppingToken);
    }

    // Example method for future API calls
    // private async Task CallNightlyJobApiAsync(CancellationToken cancellationToken)
    // {
    //     try
    //     {
    //         using var httpClient = new HttpClient();
    //         var apiUrl = _configuration["ScootrApi:BaseUrl"];
    //         var response = await httpClient.GetAsync($"{apiUrl}/api/jobs/nightly", cancellationToken);
    //         response.EnsureSuccessStatusCode();
    //         _logger.LogInformation("Nightly job API call successful");
    //     }
    //     catch (Exception ex)
    //     {
    //         _logger.LogError(ex, "Failed to call nightly job API");
    //         throw; // Re-throw to be caught by DoWorkAsync
    //     }
    // }
}

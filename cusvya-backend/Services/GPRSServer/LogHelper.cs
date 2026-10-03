using Microsoft.Extensions.Logging;

namespace GprsServer
{
    /// <summary>
    /// Helper class to log to both console and log file simultaneously
    /// </summary>
    public static class LogHelper
    {
        public static void LogInfo(ILogger logger, string message)
        {
            Console.WriteLine(message);
            logger?.LogInformation(message);
        }

        public static void LogDebug(ILogger logger, string message)
        {
            Console.WriteLine(message);
            logger?.LogDebug(message);
        }

        public static void LogWarning(ILogger logger, string message)
        {
            Console.WriteLine(message);
            logger?.LogWarning(message);
        }

        public static void LogError(ILogger logger, string message)
        {
            Console.WriteLine(message);
            logger?.LogError(message);
        }

        public static void LogError(ILogger logger, Exception ex, string message)
        {
            Console.WriteLine($"{message}: {ex.Message}");
            logger?.LogError(ex, message);
        }
    }
}

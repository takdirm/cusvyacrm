using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

namespace ScootrApi.Middleware
{
    /// <summary>
    /// Middleware to handle 401 (Unauthorized) and 403 (Forbidden) errors
    /// with consistent JSON responses for frontend processing.
    /// </summary>
    public class AuthenticationErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<AuthenticationErrorHandlingMiddleware> _logger;

        public AuthenticationErrorHandlingMiddleware(
            RequestDelegate next,
            ILogger<AuthenticationErrorHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);

                // Handle 401 Unauthorized
                if (context.Response.StatusCode == (int)HttpStatusCode.Unauthorized)
                {
                    await HandleUnauthorizedAsync(context);
                }
                // Handle 403 Forbidden
                else if (context.Response.StatusCode == (int)HttpStatusCode.Forbidden)
                {
                    await HandleForbiddenAsync(context);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception in authentication middleware");
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleUnauthorizedAsync(HttpContext context)
        {
            // Check if response has already been written
            if (context.Response.HasStarted)
                return;

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;

            var response = new
            {
                statusCode = 401,
                error = "Unauthorized",
                message = "Authentication is required to access this resource. Please sign in.",
                timestamp = DateTime.UtcNow,
                path = context.Request.Path.ToString()
            };

            _logger.LogWarning(
                "Unauthorized access attempt - Path: {Path}, IP: {IP}",
                context.Request.Path,
                context.Connection.RemoteIpAddress);

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }

        private async Task HandleForbiddenAsync(HttpContext context)
        {
            // Check if response has already been written
            if (context.Response.HasStarted)
                return;

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.Forbidden;

            var response = new
            {
                statusCode = 403,
                error = "Forbidden",
                message = "You do not have permission to access this resource.",
                timestamp = DateTime.UtcNow,
                path = context.Request.Path.ToString()
            };

            _logger.LogWarning(
                "Forbidden access attempt - Path: {Path}, User: {User}, IP: {IP}",
                context.Request.Path,
                context.User?.Identity?.Name ?? "Unknown",
                context.Connection.RemoteIpAddress);

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            // Check if response has already been written
            if (context.Response.HasStarted)
                return;

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var response = new
            {
                statusCode = 500,
                error = "Internal Server Error",
                message = "An unexpected error occurred while processing your request.",
                timestamp = DateTime.UtcNow,
                path = context.Request.Path.ToString()
            };

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }
    }
}

using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Cusvya.Api.Template.Middleware;

internal sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, title) = exception switch
        {
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "Unauthorized"),
            ArgumentException => (StatusCodes.Status400BadRequest, "Bad Request"),
            InvalidOperationException => (StatusCodes.Status409Conflict, "Conflict"),
            _ => (StatusCodes.Status500InternalServerError, "Server Error")
        };

        logger.LogWarning(exception, "Handled API exception {Title}", title);
        httpContext.Response.StatusCode = statusCode;

        await httpContext.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = "The request could not be completed.",
            Instance = httpContext.Request.Path
        }, cancellationToken);

        return true;
    }
}


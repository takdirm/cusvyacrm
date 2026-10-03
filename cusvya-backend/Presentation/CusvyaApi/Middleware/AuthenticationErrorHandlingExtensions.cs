using Microsoft.AspNetCore.Builder;

namespace ScootrApi.Middleware
{
    /// <summary>
    /// Extension methods for registering authentication error handling middleware.
    /// </summary>
    public static class AuthenticationErrorHandlingExtensions
    {
        /// <summary>
        /// Adds authentication error handling middleware to the application pipeline.
        /// This middleware intercepts 401 and 403 responses and formats them consistently
        /// for frontend consumption.
        /// </summary>
        /// <param name="builder">The application builder</param>
        /// <returns>The application builder for chaining</returns>
        public static IApplicationBuilder UseAuthenticationErrorHandling(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<AuthenticationErrorHandlingMiddleware>();
        }
    }
}

using Cusvya.Core.Template.Entities;
using FirebaseAdmin;
using FirebaseAdmin.Auth;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Cusvya.Services.Template.Auth;

public sealed class FirebaseTokenVerifier(
    IOptions<FirebaseOptions> options,
    ILogger<FirebaseTokenVerifier> logger) : IFirebaseTokenVerifier
{
    private readonly FirebaseOptions _options = options.Value;
    private readonly ILogger<FirebaseTokenVerifier> _logger = logger;
    private static readonly object AppLock = new();
    private static bool _isInitialized;

    public async Task<FirebaseTokenInfo> VerifyAsync(string idToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(idToken))
        {
            throw new UnauthorizedAccessException("Firebase token is required.");
        }

        EnsureInitialized();

        var decoded = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(idToken, cancellationToken);
        var claims = decoded.Claims;

        var role = claims.TryGetValue("app_type", out var claimValue)
            ? claimValue?.ToString()
            : null;

        var email = claims.TryGetValue("email", out var emailObj) ? emailObj?.ToString() ?? string.Empty : string.Empty;
        var name = claims.TryGetValue("name", out var nameObj) ? nameObj?.ToString() ?? string.Empty : string.Empty;
        var phoneNumber = claims.TryGetValue("phone_number", out var phoneObj) ? phoneObj?.ToString() ?? string.Empty : string.Empty;

        var appType = ResolveAppType(role, email, phoneNumber);

        return new FirebaseTokenInfo
        {
            FirebaseUid = decoded.Uid,
            Email = email,
            Name = name,
            PhoneNumber = phoneNumber,
            UserType = appType
        };
    }

    private static AppUserType ResolveAppType(string? role, string email, string phoneNumber)
    {
        if (string.Equals(role, "customer", StringComparison.OrdinalIgnoreCase))
        {
            return AppUserType.Customer;
        }

        if (string.Equals(role, "user", StringComparison.OrdinalIgnoreCase))
        {
            return AppUserType.User;
        }

        return string.IsNullOrWhiteSpace(email) && !string.IsNullOrWhiteSpace(phoneNumber)
            ? AppUserType.Customer
            : AppUserType.User;
    }

    private void EnsureInitialized()
    {
        if (_isInitialized)
        {
            return;
        }

        lock (AppLock)
        {
            if (_isInitialized)
            {
                return;
            }

            var serviceAccountJson = _options.ServiceAccountJson;
            if (string.IsNullOrWhiteSpace(serviceAccountJson) && !string.IsNullOrWhiteSpace(_options.ServiceAccountFilePath))
            {
                if (!File.Exists(_options.ServiceAccountFilePath))
                {
                    throw new InvalidOperationException(
                        $"Firebase service account file not found: {_options.ServiceAccountFilePath}");
                }

                serviceAccountJson = File.ReadAllText(_options.ServiceAccountFilePath);
            }

            if (string.IsNullOrWhiteSpace(serviceAccountJson))
            {
                throw new InvalidOperationException(
                    "Firebase configuration is missing. Set Firebase:ServiceAccountJson or Firebase:ServiceAccountFilePath.");
            }

            FirebaseApp.Create(new AppOptions
            {
#pragma warning disable CS0618
                Credential = GoogleCredential.FromJson(serviceAccountJson)
#pragma warning restore CS0618
            });

            _logger.LogInformation("Firebase Admin SDK initialized for template API.");
            _isInitialized = true;
        }
    }
}

using System.Security.Claims;
using System.Text.Encodings.Web;
using Cusvya.Core.Template.Entities;
using Cusvya.Services.Template.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Cusvya.Api.Template.Auth;

public sealed class FirebaseAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IFirebaseTokenVerifier tokenVerifier)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var authorizationHeader))
        {
            return AuthenticateResult.NoResult();
        }

        var headerValue = authorizationHeader.ToString();
        if (!headerValue.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return AuthenticateResult.Fail("Bearer token is missing.");
        }

        var token = headerValue["Bearer ".Length..].Trim();

        try
        {
            var tokenInfo = await tokenVerifier.VerifyAsync(token, Context.RequestAborted);
            var appType = tokenInfo.UserType == AppUserType.Customer ? "customer" : "user";

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, tokenInfo.FirebaseUid),
                new(ClaimTypes.Email, tokenInfo.Email),
                new(ClaimTypes.Name, tokenInfo.Name),
                new("app_type", appType)
            };

            var identity = new ClaimsIdentity(claims, Scheme.Name);
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, Scheme.Name);

            return AuthenticateResult.Success(ticket);
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "Firebase token validation failed.");
            return AuthenticateResult.Fail(ex.Message);
        }
    }
}


using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Scootr.Data.Services.Firebase;
using Scootr.Data.Services.Users;
using Scootr.Data.Services.Customers;
using System;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Scootr.Data.Authentication
{
    /// <summary>
    /// Custom authentication handler for Firebase ID tokens.
    /// Verifies Firebase tokens, resolves Scootr users/customers, and creates claims.
    /// </summary>
    public class FirebaseAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        private readonly IFirebaseUserManagementService _firebaseService;
        private readonly IUserService _userService;
        private readonly ICustomerService _customerService;

        public FirebaseAuthenticationHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            IFirebaseUserManagementService firebaseService,
            IUserService userService,
            ICustomerService customerService)
            : base(options, logger, encoder)
        {
            _firebaseService = firebaseService;
            _userService = userService;
            _customerService = customerService;
        }

        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            // Check for Authorization header
            if (!Request.Headers.ContainsKey("Authorization"))
            {
                return AuthenticateResult.NoResult();
            }

            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return AuthenticateResult.NoResult();
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            if (string.IsNullOrWhiteSpace(token))
            {
                return AuthenticateResult.Fail("Invalid token format");
            }

            try
            {
                // Verify Firebase ID token
                var firebaseToken = await _firebaseService.VerifyIdTokenAsync(token, checkRevoked: true);

                if (firebaseToken == null || string.IsNullOrWhiteSpace(firebaseToken.Uid))
                {
                    return AuthenticateResult.Fail("Invalid Firebase token");
                }

                // Try to find user in User table (admin/staff)
                var user = await _userService.GetByFirebaseUidAsync(firebaseToken.Uid);

                if (user != null)
                {
                    // User found - handle admin/staff authentication
                    if (!user.IsActive)
                    {
                        Logger.LogWarning(
                            "Inactive user attempted to authenticate. User ID: {UserId}, Firebase UID: {Uid}",
                            user.Id,
                            firebaseToken.Uid);
                        return AuthenticateResult.Fail("User account is not active");
                    }

                    // Create claims for admin/staff user
                    var userClaims = new[]
                    {
                        new Claim("uid", user.Id.ToString()),
                        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                        new Claim("firebase_uid", firebaseToken.Uid),
                        new Claim("user_id", firebaseToken.Uid),
                        new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                        new Claim("email", user.Email ?? string.Empty),
                        new Claim(ClaimTypes.Name, user.Username ?? user.Name ?? string.Empty),
                        new Claim("username", user.Username ?? string.Empty),
                        new Claim("level", user.Level.ToString()),
                        new Claim(ClaimTypes.Role, user.Level.ToString()),
                        new Claim("user_type", "user"),
                        new Claim("email_verified", firebaseToken.EmailVerified.ToString())
                    };

                    var identity = new ClaimsIdentity(userClaims, Scheme.Name);
                    var principal = new ClaimsPrincipal(identity);
                    var ticket = new AuthenticationTicket(principal, Scheme.Name);

                    Logger.LogInformation(
                        "User authenticated successfully. User ID: {UserId}, Firebase UID: {Uid}, Level: {Level}",
                        user.Id,
                        firebaseToken.Uid,
                        user.Level);

                    return AuthenticateResult.Success(ticket);
                }

                // User not found in User table - try Customer table
                var customer = await _customerService.GetByUIdAsync(firebaseToken.Uid);

                if (customer != null)
                {
                    // Customer found - handle customer authentication
                    if (!customer.IsActive)
                    {
                        Logger.LogWarning(
                            "Inactive customer attempted to authenticate. Customer ID: {CustomerId}, Firebase UID: {Uid}",
                            customer.Id,
                            firebaseToken.Uid);
                        return AuthenticateResult.Fail("Customer account is not active");
                    }

                    // Create claims for customer
                    var customerClaims = new List<Claim>
                    {
                        new Claim("uid", customer.Id.ToString()),
                        new Claim(ClaimTypes.NameIdentifier, customer.Id.ToString()),
                        new Claim("firebase_uid", firebaseToken.Uid),
                        new Claim("user_id", firebaseToken.Uid),
                        new Claim("customer_id", customer.Id.ToString()),
                        new Claim("user_type", "customer"),
                        new Claim(ClaimTypes.Role, "Customer"),
                        new Claim("phone_number", customer.PhoneNumber ?? string.Empty)
                    };

                    if (!string.IsNullOrWhiteSpace(customer.Email))
                    {
                        customerClaims.Add(new Claim(ClaimTypes.Email, customer.Email));
                        customerClaims.Add(new Claim("email", customer.Email));
                    }

                    if (!string.IsNullOrWhiteSpace(customer.FirstName))
                    {
                        var fullName = $"{customer.FirstName} {customer.LastName ?? ""}".Trim();
                        customerClaims.Add(new Claim(ClaimTypes.Name, fullName));
                    }

                    var customerIdentity = new ClaimsIdentity(customerClaims, Scheme.Name);
                    var customerPrincipal = new ClaimsPrincipal(customerIdentity);
                    var customerTicket = new AuthenticationTicket(customerPrincipal, Scheme.Name);

                    Logger.LogInformation(
                        "Customer authenticated successfully. Customer ID: {CustomerId}, Firebase UID: {Uid}",
                        customer.Id,
                        firebaseToken.Uid);

                    return AuthenticateResult.Success(customerTicket);
                }

                // Not found in either table
                Logger.LogWarning(
                    "Firebase user authenticated but not found in User or Customer tables. Firebase UID: {Uid}",
                    firebaseToken.Uid);
                return AuthenticateResult.Fail("User or Customer not found in system");
            }
            catch (UnauthorizedAccessException ex)
            {
                Logger.LogWarning(ex, "Firebase token verification failed");
                return AuthenticateResult.Fail(ex.Message);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error during Firebase authentication");
                return AuthenticateResult.Fail("Authentication error");
            }
        }
    }
}

using Cusvya.Api.Template.Contracts.Auth;
using Cusvya.Api.Template.Contracts.Customers;
using Cusvya.Api.Template.Contracts.Users;
using Cusvya.Core.Template.Entities;
using Cusvya.Services.Template.Auth;
using Cusvya.Services.Template.Customers;
using Cusvya.Services.Template.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cusvya.Api.Template.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    IFirebaseTokenVerifier tokenVerifier,
    IUserService userService,
    ICustomerService customerService) : ControllerBase
{
    [HttpPost("validate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TokenValidationResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidateToken([FromBody] ValidateTokenRequest request, CancellationToken cancellationToken)
    {
        var tokenInfo = await tokenVerifier.VerifyAsync(request.IdToken, cancellationToken);
        return Ok(MapToken(tokenInfo));
    }

    [HttpPost("web-login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> WebLogin([FromBody] WebLoginRequest request, CancellationToken cancellationToken)
    {
        var tokenInfo = await tokenVerifier.VerifyAsync(request.IdToken, cancellationToken);
        if (tokenInfo.UserType != AppUserType.User)
        {
            return Forbid();
        }

        var user = await userService.UpsertByFirebaseUidAsync(new User
        {
            FirebaseUid = tokenInfo.FirebaseUid,
            Name = string.IsNullOrWhiteSpace(tokenInfo.Name) ? "Web User" : tokenInfo.Name,
            Email = tokenInfo.Email,
            PhoneNumber = tokenInfo.PhoneNumber,
            IsActive = true
        }, cancellationToken);

        return Ok(new UserResponse(
            user.Id,
            user.Name,
            user.Email,
            user.PhoneNumber,
            user.FirebaseUid,
            user.IsActive,
            new DateTimeOffset(DateTime.SpecifyKind(user.CreatedAtUtc, DateTimeKind.Utc)),
            user.UpdatedAtUtc is null ? null : new DateTimeOffset(DateTime.SpecifyKind(user.UpdatedAtUtc.Value, DateTimeKind.Utc))));
    }

    [HttpPost("mobile-register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> MobileRegister([FromBody] MobileRegisterRequest request, CancellationToken cancellationToken)
    {
        var tokenInfo = await tokenVerifier.VerifyAsync(request.IdToken, cancellationToken);
        if (tokenInfo.UserType != AppUserType.Customer)
        {
            return Forbid();
        }

        var customer = await customerService.UpsertByFirebaseUidAsync(new Customer
        {
            FirebaseUid = tokenInfo.FirebaseUid,
            Name = string.IsNullOrWhiteSpace(request.Name) ? "Mobile Customer" : request.Name,
            Email = tokenInfo.Email,
            PhoneNumber = tokenInfo.PhoneNumber,
            IsActive = true
        }, cancellationToken);

        return Ok(new CustomerResponse(
            customer.Id,
            customer.Name,
            customer.Email,
            customer.PhoneNumber,
            customer.FirebaseUid,
            customer.IsActive,
            new DateTimeOffset(DateTime.SpecifyKind(customer.CreatedAtUtc, DateTimeKind.Utc)),
            customer.UpdatedAtUtc is null ? null : new DateTimeOffset(DateTime.SpecifyKind(customer.UpdatedAtUtc.Value, DateTimeKind.Utc))));
    }

    private static TokenValidationResponse MapToken(FirebaseTokenInfo tokenInfo) =>
        new(
            tokenInfo.FirebaseUid,
            tokenInfo.Email,
            tokenInfo.Name,
            tokenInfo.PhoneNumber,
            tokenInfo.UserType == AppUserType.Customer ? "customer" : "user");
}

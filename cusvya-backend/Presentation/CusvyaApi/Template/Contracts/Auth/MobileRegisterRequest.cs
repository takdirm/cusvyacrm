using System.ComponentModel.DataAnnotations;

namespace Cusvya.Api.Template.Contracts.Auth;

/// <summary>
/// Payload used by the mobile app after OTP verification to register or update a customer.
/// </summary>
public sealed record MobileRegisterRequest
{
    [Required]
    public required string IdToken { get; init; }

    [MaxLength(120)]
    public string Name { get; init; } = string.Empty;
}


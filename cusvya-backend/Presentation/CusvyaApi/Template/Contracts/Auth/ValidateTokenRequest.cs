using System.ComponentModel.DataAnnotations;

namespace Cusvya.Api.Template.Contracts.Auth;

/// <summary>
/// Payload used to validate a Firebase ID token.
/// </summary>
public sealed record ValidateTokenRequest
{
    [Required]
    public required string IdToken { get; init; }
}

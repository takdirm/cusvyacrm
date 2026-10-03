using System.ComponentModel.DataAnnotations;

namespace Cusvya.Api.Template.Contracts.Auth;

/// <summary>
/// Payload used by the web client to validate Firebase login and upsert user data.
/// </summary>
public sealed record WebLoginRequest
{
    [Required]
    public required string IdToken { get; init; }
}


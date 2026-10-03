using System.ComponentModel.DataAnnotations;

namespace Cusvya.Api.Template.Contracts.Users;

/// <summary>
/// Payload used to create or update an application user.
/// </summary>
public sealed record UserUpsertRequest
{
    [Required, MaxLength(120)]
    public required string Name { get; init; }

    [Required, EmailAddress, MaxLength(200)]
    public required string Email { get; init; }

    [MaxLength(30)]
    public string PhoneNumber { get; init; } = string.Empty;

    [Required, MaxLength(128)]
    public required string FirebaseUid { get; init; }

    public bool IsActive { get; init; } = true;
}

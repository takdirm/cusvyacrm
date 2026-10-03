using System.ComponentModel.DataAnnotations;

namespace Cusvya.Api.Template.Contracts.Customers;

/// <summary>
/// Payload used to create or update a customer.
/// </summary>
public sealed record CustomerUpsertRequest
{
    [Required, MaxLength(120)]
    public required string Name { get; init; }

    [EmailAddress, MaxLength(200)]
    public string Email { get; init; } = string.Empty;

    [Required, MaxLength(30)]
    public required string PhoneNumber { get; init; }

    [Required, MaxLength(128)]
    public required string FirebaseUid { get; init; }

    public bool IsActive { get; init; } = true;
}

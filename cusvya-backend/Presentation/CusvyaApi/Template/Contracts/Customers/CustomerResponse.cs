namespace Cusvya.Api.Template.Contracts.Customers;

/// <summary>
/// Customer resource returned by the API.
/// </summary>
public sealed record CustomerResponse(
    int Id,
    string Name,
    string Email,
    string PhoneNumber,
    string FirebaseUid,
    bool IsActive,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc);


namespace Cusvya.Api.Template.Contracts.Users;

/// <summary>
/// User resource returned by the API.
/// </summary>
public sealed record UserResponse(
    int Id,
    string Name,
    string Email,
    string PhoneNumber,
    string FirebaseUid,
    bool IsActive,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc);


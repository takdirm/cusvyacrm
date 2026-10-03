namespace Cusvya.Api.Template.Contracts.Auth;

/// <summary>
/// Token validation result returned after Firebase token verification.
/// </summary>
public sealed record TokenValidationResponse(
    string FirebaseUid,
    string Email,
    string Name,
    string PhoneNumber,
    string AppType);


using Cusvya.Core.Template.Entities;

namespace Cusvya.Services.Template.Auth;

public sealed record FirebaseTokenInfo
{
    public required string FirebaseUid { get; init; }
    public required string Email { get; init; }
    public required string Name { get; init; }
    public required string PhoneNumber { get; init; }
    public AppUserType UserType { get; init; }
}

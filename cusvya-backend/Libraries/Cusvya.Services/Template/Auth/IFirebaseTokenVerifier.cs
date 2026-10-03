namespace Cusvya.Services.Template.Auth;

public interface IFirebaseTokenVerifier
{
    Task<FirebaseTokenInfo> VerifyAsync(string idToken, CancellationToken cancellationToken = default);
}


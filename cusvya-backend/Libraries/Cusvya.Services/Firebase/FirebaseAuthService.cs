using Firebase.Auth;
using System.Threading.Tasks;

namespace Scootr.Data.Services.Firebase;

public class FirebaseAuthService : IFirebaseAuthService
{
    private readonly FirebaseAuthClient _firebaseAuth;

    public FirebaseAuthService(FirebaseAuthClient firebaseAuth)
    {
        _firebaseAuth = firebaseAuth;
    }

    public async Task<FirebaseUser> SignUp(string email, string password)
    {
        FirebaseUser firebaseUser = null;
        var userCredentials = await _firebaseAuth.CreateUserWithEmailAndPasswordAsync(email, password);
        
        if (userCredentials is null || userCredentials.User is null)
        {
            return null;
        }
        else
        {
            firebaseUser = new FirebaseUser();
            firebaseUser.Token= await userCredentials.User.GetIdTokenAsync();
            firebaseUser.UID= userCredentials.User.Uid;
        }
        return firebaseUser;
    }

    public async Task<FirebaseUser> Login(string email, string password)
    {
        FirebaseUser firebaseUser = null;
        var userCredentials = await _firebaseAuth.SignInWithEmailAndPasswordAsync(email, password);

        if (userCredentials is null || userCredentials.User is null)
        {
            return null;
        }
        else
        {
            firebaseUser = new FirebaseUser();
            firebaseUser.Token = await userCredentials.User.GetIdTokenAsync();
            firebaseUser.UID = userCredentials.User.Uid;
        }
        return firebaseUser;
    }

    public void SignOut() => _firebaseAuth.SignOut();
}

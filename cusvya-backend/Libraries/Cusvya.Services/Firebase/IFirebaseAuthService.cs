using System.Threading.Tasks;

namespace Scootr.Data.Services.Firebase;

public interface IFirebaseAuthService
{
    public Task<FirebaseUser?> SignUp(string email, string password);

    public Task<FirebaseUser> Login(string email, string password);

    public void SignOut();
}

namespace Scootr.Data.DTOs.Auth
{
    /// <summary>
    /// DTO for Firebase-based sign-in request.
    /// Client sends Firebase ID token obtained after Firebase Authentication.
    /// </summary>
    public class FirebaseSignInDto
    {
        /// <summary>
        /// Firebase ID token from client-side Firebase Authentication.
        /// </summary>
        public string IdToken { get; set; } = string.Empty;
    }
}

namespace Scootr.Data.DTOs.Users
{
    /// <summary>
    /// DTO for creating a new user with Firebase Authentication.
    /// Password is NOT included - Firebase handles authentication separately.
    /// </summary>
    public class CreateUserWithFirebaseDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Username { get; set; }
        public string? Phone { get; set; }
        public string Level { get; set; } = "Customer";
        public bool IsActive { get; set; } = true;
    }
}

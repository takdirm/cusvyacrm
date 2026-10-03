namespace Scootr.Data.DTOs.Users
{
    /// <summary>
    /// DTO for updating an existing user.
    /// Password is NOT included - use Firebase password reset flow.
    /// </summary>
    public class UpdateUserWithFirebaseDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Username { get; set; }
        public string? Phone { get; set; }
        public string? Level { get; set; }
        public bool? IsActive { get; set; }
    }
}

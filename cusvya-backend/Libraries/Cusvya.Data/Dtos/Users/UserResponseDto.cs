namespace Scootr.Data.DTOs.Users
{
    /// <summary>
    /// Secure user response DTO without password exposure.
    /// </summary>
    public class UserResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public string? FirebaseUid { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

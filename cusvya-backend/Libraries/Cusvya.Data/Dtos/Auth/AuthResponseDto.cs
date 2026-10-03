namespace Scootr.Data.DTOs.Auth
{
    /// <summary>
    /// Response DTO for successful authentication.
    /// </summary>
    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string TokenType { get; set; } = "Bearer";
        public DateTime ExpiresAt { get; set; }
        public UserInfo User { get; set; } = new();
    }

    public class UserInfo
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public string FirebaseUid { get; set; } = string.Empty;
    }
}

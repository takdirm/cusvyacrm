namespace Scootr.Data.DTOs.Users
{
    // CreateUserDto.cs
    public class CreateUserDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

}

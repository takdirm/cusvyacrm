using System.ComponentModel.DataAnnotations;

namespace Scootr.Data.DTOs.Users
{
    /// <summary>
    /// DTO for setting a user's Firebase password by admin.
    /// </summary>
    public class SetPasswordDto
    {
        /// <summary>
        /// New password for the user. Must be at least 6 characters.
        /// </summary>
        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; } = string.Empty;
    }
}

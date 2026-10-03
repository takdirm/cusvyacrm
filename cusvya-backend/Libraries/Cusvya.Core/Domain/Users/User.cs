using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Scootr.Core.Domain.Customers;

namespace Scootr.Core.Domain.Users
{
    public class User
    {
        [Key]
        [Required]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = null!;

        public string Username { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public UserLevel Level { get; set; } = UserLevel.Customer;
        public string UID { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

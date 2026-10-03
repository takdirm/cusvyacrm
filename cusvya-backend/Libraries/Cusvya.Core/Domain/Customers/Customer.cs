using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Scootr.Core.Domain.Billing;
using Scootr.Core.Domain.Billings;
using Scootr.Core.Domain.Documents;
using Scootr.Core.Domain.Plans;
using Scootr.Core.Domain.Regions;

namespace Scootr.Core.Domain.Customers
{
    public class Customer
    {
        [Key]
        [Required]
        public int Id { get; set; }

        /// <summary>
        /// Firebase UID — set on first registration; required to identify the user.
        /// </summary>
        [Required]
        [MaxLength(128)]
        public string UID { get; set; }

        /// <summary>
        /// Phone number provided at registration and verified via Firebase OTP.
        /// </summary>
        [Required]
        [Phone]
        [MaxLength(20)]
        public string PhoneNumber { get; set; }

        // --- Optional profile fields, populated after registration ---

        [MaxLength(100)]
        public string? FirstName { get; set; }

        [MaxLength(100)]
        public string? LastName { get; set; }

        [EmailAddress]
        [MaxLength(255)]
        public string? Email { get; set; }

        public string? PasswordHash { get; set; }

        public DateTime? DateOfBirth { get; set; }

        [MaxLength(500)]
        public string? Address { get; set; }

        [MaxLength(100)]
        public string? City { get; set; }

        [MaxLength(100)]
        public string? State { get; set; }

        [MaxLength(20)]
        public string? ZipCode { get; set; }

        [Required]
        [MaxLength(2)]
        public string PreferredLanguageCode { get; set; } = "en";

        public bool IsEmailVerified { get; set; }

        /// <summary>
        /// Set to true once Firebase phone OTP verification succeeds.
        /// </summary>
        public bool IsPhoneVerified { get; set; }

        [Required]
        public int RegionId { get; set; }

        public virtual Region Region { get; set; } = null!;

        public virtual CustomerKYC? CustomerKYC { get; set; }
        public virtual CustomerDL? CustomerDL { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastLoginAt { get; set; }

        public bool IsActive { get; set; } = true;

        public BillingType BillingType { get; set; }

        // Navigation properties
        public virtual CustomerBilling? CustomerBilling { get; set; }
        public virtual CustomerWallet? Wallet { get; set; }
        public virtual ICollection<Booking> Bookings { get; set; }
        public virtual ICollection<Payment> Payments { get; set; }
        public virtual ICollection<Arrears> Arrears { get; set; }
        public virtual ActivePlan? ActivePlan { get; set; }
        public virtual ICollection<Document>? Documents { get; set; }
        public virtual ICollection<CustomerDevice> Devices { get; set; } = new List<CustomerDevice>();
    }
}

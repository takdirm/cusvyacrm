using System;
using System.ComponentModel.DataAnnotations;
using Scootr.Core.Domain.Customers;

namespace Scootr.Data.Dtos.Customers
{
    /// <summary>
    /// Used for the initial Firebase phone-OTP registration.
    /// Only PhoneNumber and the Firebase UID are required.
    /// </summary>
    public class CustomerRegisterDto
    {
        public string PhoneNumber { get; set; }
        public string UID { get; set; }
    }

    /// <summary>
    /// Returned after a successful registration.
    /// </summary>
    public class CustomerRegisterResponseDto
    {
        public int Id { get; set; }
        public string UID { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsPhoneVerified { get; set; }
        public bool IsNewCustomer { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CustomerCreateDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Password { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string ZipCode { get; set; }
        public int BillingType { get; set; }
        [RegularExpression("^(en|hn|kn)$", ErrorMessage = "PreferredLanguageCode must be one of: en, hn, kn")]
        public string PreferredLanguageCode { get; set; } = "en";
    }

    public class CustomerReadDto
    {
        public int Id { get; set; }
        public int RegionId { get; set; }
        public string RegionCode { get; set; }
        public string RegionName { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string ZipCode { get; set; }
        public bool IsEmailVerified { get; set; }
        public bool IsPhoneVerified { get; set; }
        public CustomerKycStatus CustomerKycStatus { get; set; }
        public CustomerDLStatus CustomerDLStatus { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public bool IsActive { get; set; }
        public int BillingType { get; set; }
        public string PreferredLanguageCode { get; set; }
    }

    public class CustomerUpdateDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string ZipCode { get; set; }
        [RegularExpression("^(en|hn|kn)$", ErrorMessage = "PreferredLanguageCode must be one of: en, hn, kn")]
        public string PreferredLanguageCode { get; set; } = "en";
    }

    public class UpdateKycStatusDto
    {
        [Required]
        public CustomerKycStatus Status { get; set; }
    }

    public class UpdatePreferredLanguageDto
    {
        [Required]
        [RegularExpression("^(en|hn|kn)$", ErrorMessage = "PreferredLanguageCode must be one of: en, hn, kn")]
        public string PreferredLanguageCode { get; set; } = "en";
    }
}

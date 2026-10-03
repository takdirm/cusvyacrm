using System.ComponentModel.DataAnnotations;

namespace Scootr.Data.Dtos.Customers
{
    /// <summary>
    /// Request to register or update a customer device for push notifications.
    /// CustomerId is NOT accepted from the client - it is resolved from authenticated Firebase UID.
    /// </summary>
    public class RegisterCustomerDeviceRequest
    {
        /// <summary>
        /// Firebase Installation ID (FID) from @react-native-firebase/installations
        /// </summary>
        [Required(ErrorMessage = "Firebase Installation ID is required")]
        [MaxLength(256)]
        public string FirebaseInstallationId { get; set; } = null!;

        /// <summary>
        /// FCM registration token from @react-native-firebase/messaging
        /// Required for push notifications.
        /// </summary>
        [Required(ErrorMessage = "FCM Token is required")]
        [MaxLength(4096)]
        public string FcmToken { get; set; } = null!;

        /// <summary>
        /// Device platform: Android or iOS
        /// </summary>
        [Required(ErrorMessage = "Platform is required")]
        [MaxLength(20)]
        public string Platform { get; set; } = null!;

        /// <summary>
        /// Application version running on the device
        /// </summary>
        [MaxLength(50)]
        public string? AppVersion { get; set; }
    }

    /// <summary>
    /// Request to unregister a device on logout
    /// </summary>
    public class UnregisterCustomerDeviceRequest
    {
        [Required(ErrorMessage = "Firebase Installation ID is required")]
        [MaxLength(256)]
        public string FirebaseInstallationId { get; set; } = null!;
    }

    /// <summary>
    /// Request to enable/disable notifications for a device
    /// </summary>
    public class UpdateDeviceNotificationPreferenceRequest
    {
        [Required]
        public bool Enabled { get; set; }
    }

    /// <summary>
    /// Response after device registration
    /// </summary>
    public class CustomerDeviceResponse
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string FirebaseInstallationId { get; set; } = null!;
        public string Platform { get; set; } = null!;
        public string? AppVersion { get; set; }
        public bool IsNotificationEnabled { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime LastSeenAt { get; set; }
    }
}

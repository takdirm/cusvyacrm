using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Scootr.Core.Domain.Customers
{
    /// <summary>
    /// Represents a mobile device/app installation registered to receive push notifications.
    /// One customer can have multiple devices (phone, tablet, etc.).
    /// Uses Firebase Installation ID (FID) for push notification targeting.
    /// </summary>
    public class CustomerDevice
    {
        [Key]
        [Required]
        public int Id { get; set; }

        /// <summary>
        /// Customer who owns this device
        /// </summary>
        [Required]
        public int CustomerId { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public virtual Customer Customer { get; set; } = null!;

        /// <summary>
        /// FCM registration token.
        /// Required for push notification delivery.
        /// This is the primary identifier used by Firebase Cloud Messaging.
        /// </summary>
        [Required]
        [MaxLength(4096)]
        public string FcmToken { get; set; } = null!;

        /// <summary>
        /// Firebase Installation ID (FID).
        /// Identifies this Firebase app installation.
        /// Stored for diagnostics and compatibility.
        /// </summary>
        [Required]
        [MaxLength(256)]
        public string FirebaseInstallationId { get; set; } = null!;

        /// <summary>
        /// Device platform: Android, iOS
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string Platform { get; set; } = null!;

        /// <summary>
        /// Application version installed on the device.
        /// Useful for debugging and understanding which app version is active.
        /// </summary>
        [MaxLength(50)]
        public string? AppVersion { get; set; }

        /// <summary>
        /// Whether the user has enabled push notifications for this installation.
        /// User can toggle this preference.
        /// </summary>
        public bool IsNotificationEnabled { get; set; } = true;

        /// <summary>
        /// Whether this device is currently active/associated with the customer.
        /// Set to false on logout or when Firebase reports invalid/unregistered FID.
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// When this device was first registered
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last time device information was updated
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last time the device connected/registered
        /// </summary>
        public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
    }
}

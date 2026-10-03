using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Scootr.Core.Domain.Customers;
using Scootr.Data.Dtos.Customers;
using Scootr.Data.Dtos.Notifications;
using Scootr.Data.Repositories.Interfaces;
using Scootr.Data.Services.Customers;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ScootrApi.Controllers
{
    /// <summary>
    /// Controller for managing customer devices for push notifications.
    /// Implements secure device registration using authenticated Firebase UID.
    /// </summary>
    [Authorize]
    [Route("api/customer-devices")]
    [ApiController]
    public class CustomerDeviceController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICustomerService _customerService;
        private readonly ILogger<CustomerDeviceController> _logger;

        public CustomerDeviceController(
            IUnitOfWork unitOfWork,
            ICustomerService customerService,
            ILogger<CustomerDeviceController> logger)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
            _customerService = customerService ?? throw new ArgumentNullException(nameof(customerService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Register a device for push notifications.
        /// SECURITY: CustomerId is resolved from authenticated Firebase UID, never from client request.
        /// If the device already exists, it is updated and reactivated.
        /// </summary>
        /// <param name="firebaseUid">Firebase UID from authentication (route parameter or claim)</param>
        /// <param name="request">Device registration request</param>
        [HttpPost("register/{firebaseUid}")]
        //[AllowAnonymous]
        [ProducesResponseType(typeof(CustomerDeviceResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(CustomerDeviceResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<CustomerDeviceResponse>> Register(
            string firebaseUid,
            [FromBody] RegisterCustomerDeviceRequest request)
        {
            if (string.IsNullOrWhiteSpace(firebaseUid))
            {
                _logger.LogWarning("Register device called without Firebase UID");
                return BadRequest(new { message = "Firebase UID is required" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _logger.LogInformation(
                "Registering device for Firebase UID {UID}, FID {FID}, Platform {Platform}",
                firebaseUid, MaskFid(request.FirebaseInstallationId), request.Platform);

            // SECURITY: Resolve customer from authenticated Firebase UID
            var customer = await _customerService.GetByUIdAsync(firebaseUid);
            if (customer == null)
            {
                _logger.LogWarning("Customer not found for Firebase UID {UID}", firebaseUid);
                return NotFound(new { message = "Customer not found" });
            }

            // Check if device already exists
            var existingDevice = await _unitOfWork.CustomerDevices
                .FirstOrDefaultAsync(d => d.FirebaseInstallationId == request.FirebaseInstallationId);

            if (existingDevice != null)
            {
                // Update existing device
                _logger.LogInformation(
                    "Updating existing device {DeviceId} for Customer {CustomerId}",
                    existingDevice.Id, customer.Id);

                existingDevice.CustomerId = customer.Id; // Re-associate if device moved to new customer
                existingDevice.FcmToken = request.FcmToken;
                existingDevice.Platform = request.Platform;
                existingDevice.AppVersion = request.AppVersion;
                existingDevice.IsActive = true;
                existingDevice.IsNotificationEnabled = true;
                existingDevice.UpdatedAt = DateTime.UtcNow;
                existingDevice.LastSeenAt = DateTime.UtcNow;

                await _unitOfWork.SaveChangesAsync();

                return Ok(MapToResponse(existingDevice));
            }
            else
            {
                // Create new device
                var newDevice = new CustomerDevice
                {
                    CustomerId = customer.Id,
                    FirebaseInstallationId = request.FirebaseInstallationId,
                    FcmToken = request.FcmToken,
                    Platform = request.Platform,
                    AppVersion = request.AppVersion,
                    IsNotificationEnabled = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    LastSeenAt = DateTime.UtcNow
                };

                await _unitOfWork.CustomerDevices.AddAsync(newDevice);
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation(
                    "Created new device {DeviceId} for Customer {CustomerId}",
                    newDevice.Id, customer.Id);

                return CreatedAtAction(
                    nameof(Register),
                    new { firebaseUid = firebaseUid },
                    MapToResponse(newDevice));
            }
        }

        /// <summary>
        /// Unregister a device on logout.
        /// Marks the device as inactive without deleting it (preserves history).
        /// </summary>
        /// <param name="firebaseUid">Firebase UID from authentication</param>
        /// <param name="request">Unregister request containing FID</param>
        [HttpPost("unregister/{firebaseUid}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
         [AllowAnonymous]
        public async Task<IActionResult> Unregister(
            string firebaseUid,
            [FromBody] UnregisterCustomerDeviceRequest request)
        {
            if (string.IsNullOrWhiteSpace(firebaseUid))
            {
                return BadRequest(new { message = "Firebase UID is required" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _logger.LogInformation(
                "Unregistering device for Firebase UID {UID}, FID {FID}",
                firebaseUid, MaskFid(request.FirebaseInstallationId));

            // SECURITY: Resolve customer from authenticated Firebase UID
            var customer = await _customerService.GetByUIdAsync(firebaseUid);
            if (customer == null)
            {
                _logger.LogWarning("Customer not found for Firebase UID {UID}", firebaseUid);
                return NotFound(new { message = "Customer not found" });
            }

            // Find device
            var device = await _unitOfWork.CustomerDevices
                .FirstOrDefaultAsync(d => d.FirebaseInstallationId == request.FirebaseInstallationId
                                       && d.CustomerId == customer.Id);

            if (device == null)
            {
                _logger.LogWarning(
                    "Device not found for Customer {CustomerId}, FID {FID}",
                    customer.Id, MaskFid(request.FirebaseInstallationId));
                return NotFound(new { message = "Device not found" });
            }

            // Deactivate device (don't delete - preserve history)
            device.IsActive = false;
            device.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation(
                "Deactivated device {DeviceId} for Customer {CustomerId}",
                device.Id, customer.Id);

            return Ok(new { message = "Device unregistered successfully" });
        }

        /// <summary>
        /// Update notification preference for a device.
        /// Allows customer to enable/disable push notifications.
        /// </summary>
        /// <param name="firebaseUid">Firebase UID from authentication</param>
        /// <param name="firebaseInstallationId">Firebase Installation ID</param>
        /// <param name="request">Notification preference update</param>
        [HttpPut("{firebaseUid}/notifications/{firebaseInstallationId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateNotificationPreference(
            string firebaseUid,
            string firebaseInstallationId,
            [FromBody] UpdateDeviceNotificationPreferenceRequest request)
        {
            if (string.IsNullOrWhiteSpace(firebaseUid))
            {
                return BadRequest(new { message = "Firebase UID is required" });
            }

            if (string.IsNullOrWhiteSpace(firebaseInstallationId))
            {
                return BadRequest(new { message = "Firebase Installation ID is required" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _logger.LogInformation(
                "Updating notification preference for Firebase UID {UID}, FID {FID} to {Enabled}",
                firebaseUid, MaskFid(firebaseInstallationId), request.Enabled);

            // SECURITY: Resolve customer from authenticated Firebase UID
            var customer = await _customerService.GetByUIdAsync(firebaseUid);
            if (customer == null)
            {
                return NotFound(new { message = "Customer not found" });
            }

            // Find device
            var device = await _unitOfWork.CustomerDevices
                .FirstOrDefaultAsync(d => d.FirebaseInstallationId == firebaseInstallationId);

            if (device == null)
            {
                return NotFound(new { message = "Device not found" });
            }

            // SECURITY: Ensure device belongs to authenticated customer
            if (device.CustomerId != customer.Id)
            {
                _logger.LogWarning(
                    "Customer {CustomerId} attempted to modify device {DeviceId} belonging to Customer {OwnerCustomerId}",
                    customer.Id, device.Id, device.CustomerId);
                return Forbid();
            }

            // Update preference
            device.IsNotificationEnabled = request.Enabled;
            device.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation(
                "Updated notification preference for device {DeviceId} to {Enabled}",
                device.Id, request.Enabled);

            return Ok(new
            {
                message = "Notification preference updated successfully",
                enabled = request.Enabled
            });
        }

        private CustomerDeviceResponse MapToResponse(CustomerDevice device)
        {
            return new CustomerDeviceResponse
            {
                Id = device.Id,
                CustomerId = device.CustomerId,
                FirebaseInstallationId = device.FirebaseInstallationId,
                Platform = device.Platform,
                AppVersion = device.AppVersion,
                IsNotificationEnabled = device.IsNotificationEnabled,
                IsActive = device.IsActive,
                CreatedAt = device.CreatedAt,
                UpdatedAt = device.UpdatedAt,
                LastSeenAt = device.LastSeenAt
            };
        }

        private string MaskFid(string fid)
        {
            if (string.IsNullOrEmpty(fid) || fid.Length <= 8)
                return "****";

            return $"{fid[..4]}...{fid[^4..]}";
        }
    }
}

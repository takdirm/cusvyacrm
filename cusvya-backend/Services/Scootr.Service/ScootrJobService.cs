using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Scootr.Data.Services.Gprs;
using Scootr.Data.Services.Notifications;
using Scootr.Data.Services.Plans;
using Scootr.Data.Services.Settings;
using Scootr.Data.Services.Vehicles;
using Scootr.Core.Domain.Plans;
using Scootr.Core.Domain.Settings;
using Scootr.Core.Domain.Notifications;
using Scootr.Core.Domain.Vehicles;
using Scootr.Core.Domain.Gprs;
using Scootr.Data.Dtos.Plans;
using Scootr.Data;
using Scootr.Data.Repositories.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace Scootr.Manager.Service;

/// <summary>
/// Enhanced implementation of scheduled job service with automated monitoring and notifications
/// </summary>
public class ScootrJobService : IScootrJobService
{
    private readonly ILogger<ScootrJobService> _logger;
    private readonly IHttpClientFactory? _httpClientFactory;
    private readonly IGprsService? _gprsService;
    private readonly INotificationService? _notificationService;
    private readonly IBookingService? _bookingService;
    private readonly ISettingsService? _settingsService;
    private readonly IVehicleService? _vehicleService;
    private readonly IConfiguration? _configuration;
    private readonly IRepository<Notification>? _notificationRepository;
    private readonly IUnitOfWork? _unitOfWork;

    public ScootrJobService(
        ILogger<ScootrJobService> logger,
        IHttpClientFactory? httpClientFactory = null,
        IGprsService? gprsService = null,
        INotificationService? notificationService = null,
        IBookingService? bookingService = null,
        ISettingsService? settingsService = null,
        IVehicleService? scooterService = null,
        IConfiguration? configuration = null,
        IRepository<Notification>? notificationRepository = null,
        IUnitOfWork? unitOfWork = null)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _gprsService = gprsService;
        _notificationService = notificationService;
        _bookingService = bookingService;
        _settingsService = settingsService;
        _vehicleService = scooterService;
        _configuration = configuration;
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
    }

    /// <summary>
    /// Main execution method that runs all scheduled jobs
    /// </summary>
    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("ScootrJobService executing at: {time}", DateTimeOffset.Now);

        try
        {
            // Run all job methods
            await MonitorScooterAlarmsAsync(cancellationToken);
            await CheckOwnershipPaymentOverdueAsync(cancellationToken);
            await CheckOwnershipPaymentClearedAsync(cancellationToken);
            await CheckRentalReturnOverdueAsync(cancellationToken);
            await CheckRentalRenewedAsync(cancellationToken);
            await SendOwnershipPaymentRemindersAsync(cancellationToken);
            await SendRentalRenewalRemindersAsync(cancellationToken);
            await ClearGPRSHistoryDataAsync(cancellationToken);

            _logger.LogInformation("ScootrJobService completed all jobs successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing ScootrJobService jobs");
        }
    }

    /// <summary>
    /// Monitor all assigned scooters for alarms and send notifications to admin users
    /// </summary>
    public async Task MonitorScooterAlarmsAsync(CancellationToken cancellationToken = default)
    {
        if (_gprsService == null || _notificationService == null || _bookingService == null)
        {
            _logger.LogWarning("Required services not available for MonitorScooterAlarmsAsync");
            return;
        }

        try
        {
            _logger.LogInformation("Starting scooter alarm monitoring...");

            // Get all active bookings with assigned scooters
            var bookings = await _bookingService.GetBookingsPagedAsync(
                page: 1,
                pageSize: 1000,
                bookingStatus: BookingStatus.VehicleAssigned);

            int alarmsDetected = 0;

            foreach (var booking in bookings.Items)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                if (booking.VehicleId == null)
                    continue;

                try
                {
                    // Get scooter snapshot from GPRS service
                    var snapshot = await _gprsService.GetVehicleSnapshotAsync(booking.VehicleId.Value);

                    // Check if there's an active alarm based on HasActiveAlarm or InfoType
                    if (snapshot != null && snapshot.HasActiveAlarm && snapshot.TerminalCurrent != null)
                    {
                        // Prioritize HeartbeatCurrent.AlarmStatus if it's not "Normal"
                        string? alarmInfo = null;

                        if (snapshot.HeartbeatCurrent?.AlarmStatus != null && 
                            !string.Equals(snapshot.HeartbeatCurrent.AlarmStatus, "Normal", StringComparison.OrdinalIgnoreCase))
                        {
                            alarmInfo = snapshot.HeartbeatCurrent.AlarmStatus;
                        }
                        else
                        {
                            alarmInfo = snapshot.TerminalCurrent.LastInfoType ?? snapshot.TerminalCurrent.LastSummary ?? "Unknown";
                        }

                        // Check if alarm type requires notification
                        if (await IsAlarmTypeSignificantAsync(alarmInfo))
                        {
                            alarmsDetected++;
                            _logger.LogWarning("Alarm detected for Scooter {ScooterId}: {AlarmInfo}", 
                                booking.VehicleId, alarmInfo);

                            // Send notification to admin users
                            var customerName = $"{booking.FirstName} {booking.LastName}".Trim();
                            var location = snapshot.LocationCurrent != null ? 
                                $"{snapshot.LocationCurrent.Latitude}, {snapshot.LocationCurrent.Longitude}" : "Unknown";

                            var placeholders = new Dictionary<string, string>
                            {
                                { "ScooterId", booking.VehicleId.ToString() },
                                { "AlarmType", alarmInfo },
                                { "CustomerName", customerName },
                                { "BookingId", booking.Id.ToString() },
                                { "Location", location }
                            };

                            // Get admin notification settings
                            var adminPhone = _configuration?["AdminNotifications:Phone"] ?? "";
                            if (!string.IsNullOrEmpty(adminPhone))
                            {
                                // Get VEHICLE_ALARM notification type
                                var notificationType = await _notificationService.GetNotificationTypeByCodeAsync("VEHICLE_ALARM");

                                await _notificationService.SendCustomNotificationAsync(
                                    notificationType?.Id,
                                    NotificationChannel.WhatsApp,
                                    adminPhone,
                                    "Vehicle Alarm Alert",
                                    $"Alarm detected on Scooter {booking.VehicleId}: {alarmInfo}. " +
                                    $"Customer: {customerName}, Booking: {booking.Id}, Location: {location}",
                                    adminUserId: "admin",
                                    bookingId: booking.Id,
                                    scooterId: booking.VehicleId);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error checking alarm for scooter {ScooterId}", booking.VehicleId);
                }
            }

            _logger.LogInformation("Alarm monitoring completed. Alarms detected: {Count}", alarmsDetected);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in MonitorScooterAlarmsAsync");
        }
    }

    /// <summary>
    /// Check ownership bookings for overdue payments and turn off engine
    /// </summary>
    public async Task CheckOwnershipPaymentOverdueAsync(CancellationToken cancellationToken = default)
    {
        if (_bookingService == null || _settingsService == null || _gprsService == null)
        {
            _logger.LogWarning("Required services not available for CheckOwnershipPaymentOverdueAsync");
            return;
        }

        try
        {
            _logger.LogInformation("Checking ownership payment overdues...");

            // Get grace period settings
            var gracePeriodSettings = await _settingsService.LoadSettingAsync<VehicleGracePeriodSettings>();
            int graceDays = gracePeriodSettings?.NoOfDaysForMissingRepayment ?? 1;

            // Get active ownership bookings
            var bookings = await _bookingService.GetBookingsPagedAsync(
                page: 1,
                pageSize: 1000,
                bookingType: BookingType.Ownership,
                bookingStatus: BookingStatus.VehicleAssigned);

            int overdueCount = 0;

            foreach (var booking in bookings.Items)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                if (booking.NextPaymentDate == null || booking.VehicleId == null)
                    continue;

                var overdueDate = booking.NextPaymentDate.Value.AddDays(graceDays);

                if (DateTime.UtcNow > overdueDate)
                {
                    // Get scooter snapshot to check connection status
                    var snapshot = await _gprsService.GetVehicleSnapshotAsync(booking.VehicleId.Value);

                    if (snapshot?.HeartbeatCurrent == null)
                    {
                        _logger.LogWarning("No GPRS heartbeat data for Scooter {ScooterId}, skipping engine control", booking.VehicleId);
                        continue;
                    }

                    // Check engine override before proceeding
                    bool canTurnOff = await ShouldApplyEngineControlAsync(booking.VehicleId.Value, wantToTurnOff: true, cancellationToken);
                    if (!canTurnOff)
                    {
                        _logger.LogInformation("Engine override prevents turning off Scooter {ScooterId}", booking.VehicleId);
                        continue;
                    }

                    // Only turn off engine if device is connected
                    if (string.Equals(snapshot.HeartbeatCurrent.OilElectricityStatus, "Connected", StringComparison.OrdinalIgnoreCase))
                    {
                        overdueCount++;
                        _logger.LogWarning("Payment overdue for Booking {BookingId}, Scooter {ScooterId}. Due: {DueDate}", 
                            booking.Id, booking.VehicleId, booking.NextPaymentDate);

                        // Turn off engine via GPRS API
                        await TurnOffScooterEngineAsync(booking.VehicleId.Value, booking.Id, 
                            "Payment overdue", cancellationToken);

                        // Send notification to customer
                        if (_notificationService != null && booking.CustomerId > 0)
                        {
                            await SendEngineOffNotificationAsync(booking, "payment overdue");
                        }
                    }
                    else
                    {
                        _logger.LogInformation("Vehicle {VehicleId} engine already disconnected (Status: {Status}), skipping", 
                            booking.VehicleId, snapshot.HeartbeatCurrent.OilElectricityStatus);
                    }
                }
            }

            _logger.LogInformation("Ownership payment overdue check completed. Overdue bookings: {Count}", overdueCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in CheckOwnershipPaymentOverdueAsync");
        }
    }

    /// <summary>
    /// Check ownership bookings where payment has been cleared and turn on engine
    /// </summary>
    public async Task CheckOwnershipPaymentClearedAsync(CancellationToken cancellationToken = default)
    {
        if (_bookingService == null || _gprsService == null)
        {
            _logger.LogWarning("Required services not available for CheckOwnershipPaymentClearedAsync");
            return;
        }

        try
        {
            _logger.LogInformation("Checking ownership payments cleared...");

            // Get active ownership bookings
            var bookings = await _bookingService.GetBookingsPagedAsync(
                page: 1,
                pageSize: 1000,
                bookingType: BookingType.Ownership,
                bookingStatus: BookingStatus.VehicleAssigned);

            int clearedCount = 0;

            foreach (var booking in bookings.Items)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                if (booking.NextPaymentDate == null || booking.VehicleId == null)
                    continue;

                // Check if payment is current (NextPaymentDate is in the future)
                if (booking.NextPaymentDate.Value > DateTime.UtcNow)
                {
                    // Get scooter snapshot to check connection status
                    var snapshot = await _gprsService.GetVehicleSnapshotAsync(booking.VehicleId.Value);

                    if (snapshot?.HeartbeatCurrent == null)
                    {
                        _logger.LogWarning("No GPRS heartbeat data for Scooter {ScooterId}, skipping engine control", booking.VehicleId);
                        continue;
                    }

                    // Check engine override before proceeding
                    bool canTurnOn = await ShouldApplyEngineControlAsync(booking.VehicleId.Value, wantToTurnOff: false, cancellationToken);
                    if (!canTurnOn)
                    {
                        _logger.LogInformation("Engine override prevents turning on Scooter {ScooterId}", booking.VehicleId);
                        continue;
                    }

                    // Only turn on engine if device is disconnected (meaning it was previously turned off)
                    if (string.Equals(snapshot.HeartbeatCurrent.OilElectricityStatus, "Disconnected", StringComparison.OrdinalIgnoreCase))
                    {
                        clearedCount++;
                        _logger.LogInformation("Payment cleared for Booking {BookingId}, Scooter {ScooterId}. Enabling engine.", 
                            booking.Id, booking.VehicleId);

                        // Turn on engine via GPRS API
                        await TurnOnScooterEngineAsync(booking.VehicleId.Value, booking.Id, 
                            "Payment cleared", cancellationToken);
                    }
                }
            }

            _logger.LogInformation("Ownership payment cleared check completed. Engines enabled: {Count}", clearedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in CheckOwnershipPaymentClearedAsync");
        }
    }

    /// <summary>
    /// Check rental bookings for overdue returns and turn off engine
    /// </summary>
    public async Task CheckRentalReturnOverdueAsync(CancellationToken cancellationToken = default)
    {
        if (_bookingService == null || _settingsService == null || _gprsService == null)
        {
            _logger.LogWarning("Required services not available for CheckRentalReturnOverdueAsync");
            return;
        }

        try
        {
            _logger.LogInformation("Checking rental return overdues...");

            // Get grace period settings
            var gracePeriodSettings = await _settingsService.LoadSettingAsync<VehicleGracePeriodSettings>();
            int graceDays = gracePeriodSettings?.NumOfDaysRentalReturn ?? 1;

            // Get rental bookings with VehicleReturnedPending status
            var pendingBookings = await _bookingService.GetBookingsPagedAsync(
                page: 1,
                pageSize: 1000,
                bookingType: BookingType.Rental,
                bookingStatus: BookingStatus.VehicleReturnedPending);

            // Get rental bookings with VehicleAssigned status
            var assignedBookings = await _bookingService.GetBookingsPagedAsync(
                page: 1,
                pageSize: 1000,
                bookingType: BookingType.Rental,
                bookingStatus: BookingStatus.VehicleAssigned);

            // Transition VehicleAssigned bookings whose plan has expired to VehicleReturnedPending
            foreach (var booking in assignedBookings.Items)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                if (booking.PlanExpiryDate == null)
                    continue;

                if (booking.PlanExpiryDate.Value.Date <= DateTime.UtcNow.Date)
                {
                    _logger.LogInformation(
                        "Rental plan expired for Booking {BookingId} (PlanExpiryDate: {ExpiryDate}). Transitioning to VehicleReturnedPending.",
                        booking.Id, booking.PlanExpiryDate);

                    await _bookingService.UpdateBookingStatusAsync(booking.Id, BookingStatus.VehicleReturnedPending);
                }
            }

            // Combine both lists
            var allBookings = pendingBookings.Items.Concat(assignedBookings.Items).ToList();

            int overdueCount = 0;

            foreach (var booking in allBookings)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                if (booking.PlanExpiryDate == null || booking.VehicleId == null)
                    continue;

                var overdueDate = booking.PlanExpiryDate.Value.AddDays(graceDays);

                if (DateTime.UtcNow > overdueDate)
                {
                    // Get scooter snapshot to check connection status
                    var snapshot = await _gprsService.GetVehicleSnapshotAsync(booking.VehicleId.Value);

                    if (snapshot?.HeartbeatCurrent == null)
                    {
                        _logger.LogWarning("No GPRS heartbeat data for Scooter {ScooterId}, skipping engine control", booking.VehicleId);
                        continue;
                    }

                    // Check engine override before proceeding
                    bool canTurnOff = await ShouldApplyEngineControlAsync(booking.VehicleId.Value, wantToTurnOff: true, cancellationToken);
                    if (!canTurnOff)
                    {
                        _logger.LogInformation("Engine override prevents turning off Scooter {ScooterId}", booking.VehicleId);
                        continue;
                    }

                    // Only turn off engine if device is connected
                    if (string.Equals(snapshot.HeartbeatCurrent.OilElectricityStatus, "Connected", StringComparison.OrdinalIgnoreCase))
                    {
                        overdueCount++;
                        _logger.LogWarning("Return overdue for Booking {BookingId}, Scooter {ScooterId}. Expiry: {ExpiryDate}", 
                            booking.Id, booking.VehicleId, booking.PlanExpiryDate);

                        // Turn off engine via GPRS API
                        await TurnOffScooterEngineAsync(booking.VehicleId.Value, booking.Id, 
                            "Rental return overdue", cancellationToken);

                        // Send notification to customer
                        if (_notificationService != null && booking.CustomerId > 0)
                        {
                            await SendEngineOffNotificationAsync(booking, "rental return overdue");
                        }
                    }
                    else
                    {
                        _logger.LogInformation("Vehicle {VehicleId} engine already disconnected (Status: {Status}), skipping", 
                            booking.VehicleId, snapshot.HeartbeatCurrent.OilElectricityStatus);
                    }
                }
            }

            _logger.LogInformation("Rental return overdue check completed. Overdue bookings: {Count}", overdueCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in CheckRentalReturnOverdueAsync");
        }
    }

    /// <summary>
    /// Check rental bookings where rental has been renewed and turn on engine
    /// </summary>
    public async Task CheckRentalRenewedAsync(CancellationToken cancellationToken = default)
    {
        if (_bookingService == null || _gprsService == null)
        {
            _logger.LogWarning("Required services not available for CheckRentalRenewedAsync");
            return;
        }

        try
        {
            _logger.LogInformation("Checking rental renewals...");

            // Get active rental bookings
            var bookings = await _bookingService.GetBookingsPagedAsync(
                page: 1,
                pageSize: 1000,
                bookingType: BookingType.Rental,
                bookingStatus: BookingStatus.VehicleAssigned);

            int renewedCount = 0;

            foreach (var booking in bookings.Items)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                if (booking.PlanExpiryDate == null || booking.VehicleId == null)
                    continue;

                // Check if rental is still active (PlanExpiryDate is in the future)
                if (booking.PlanExpiryDate.Value > DateTime.UtcNow)
                {
                    // Get scooter snapshot to check connection status
                    var snapshot = await _gprsService.GetVehicleSnapshotAsync(booking.VehicleId.Value);

                    if (snapshot?.HeartbeatCurrent == null)
                    {
                        _logger.LogWarning("No GPRS heartbeat data for Scooter {ScooterId}, skipping engine control", booking.VehicleId);
                        continue;
                    }

                    // Check engine override before proceeding
                    bool canTurnOn = await ShouldApplyEngineControlAsync(booking.VehicleId.Value, wantToTurnOff: false, cancellationToken);
                    if (!canTurnOn)
                    {
                        _logger.LogInformation("Engine override prevents turning on Scooter {ScooterId}", booking.VehicleId);
                        continue;
                    }

                    // Only turn on engine if device is disconnected (meaning it was previously turned off)
                    if (string.Equals(snapshot.HeartbeatCurrent.OilElectricityStatus, "Disconnected", StringComparison.OrdinalIgnoreCase))
                    {
                        renewedCount++;
                        _logger.LogInformation("Rental renewed for Booking {BookingId}, Scooter {ScooterId}. Enabling engine.", 
                            booking.Id, booking.VehicleId);

                        // Turn on engine via GPRS API
                        await TurnOnScooterEngineAsync(booking.VehicleId.Value, booking.Id, 
                            "Rental renewed", cancellationToken);
                    }
                }
            }

            _logger.LogInformation("Rental renewed check completed. Engines enabled: {Count}", renewedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in CheckRentalRenewedAsync");
        }
    }

    /// <summary>
    /// Send payment reminders for ownership bookings
    /// </summary>
    public async Task SendOwnershipPaymentRemindersAsync(CancellationToken cancellationToken = default)
    {
        if (_bookingService == null || _settingsService == null || _notificationService == null)
        {
            _logger.LogWarning("Required services not available for SendOwnershipPaymentRemindersAsync");
            return;
        }

        try
        {
            _logger.LogInformation("Sending ownership payment reminders...");

            // Get grace period settings
            var gracePeriodSettings = await _settingsService.LoadSettingAsync<VehicleGracePeriodSettings>();
            int notificationDays = gracePeriodSettings?.NotificationDays ?? 3;

            // Get active ownership bookings
            var bookings = await _bookingService.GetBookingsPagedAsync(
                page: 1,
                pageSize: 1000,
                bookingType: BookingType.Ownership,
                bookingStatus: BookingStatus.VehicleAssigned);

            int remindersSent = 0;

            foreach (var booking in bookings.Items)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                if (booking.NextPaymentDate == null || booking.CustomerId <= 0)
                    continue;

                var reminderDate = booking.NextPaymentDate.Value.AddDays(-notificationDays);
                var today = DateTime.UtcNow.Date;

                // Send reminder on the notification day
                if (today == reminderDate.Date)
                {
                    // Check if notification was already sent today
                    bool alreadySent = await WasNotificationSentTodayAsync(booking.Id, "PAYMENT_REMINDER");
                    if (alreadySent)
                    {
                        _logger.LogDebug("Payment reminder already sent today for Booking {BookingId}, skipping", booking.Id);
                        continue;
                    }

                    remindersSent++;
                    _logger.LogInformation("Sending payment reminder for Booking {BookingId}", booking.Id);

                    var customerName = $"{booking.FirstName} {booking.LastName}".Trim();
                    var placeholders = new Dictionary<string, string>
                    {
                        { "CustomerName", customerName },
                        { "PaymentAmount", booking.NextPaymentAmount.ToString("N2") },
                        { "PaymentDate", booking.NextPaymentDate.Value.ToString("dd-MMM-yyyy") },
                        { "BookingId", booking.Id.ToString() }
                    };

                    // Get customer phone from booking
                    string customerPhone = booking.PhoneNumber ?? "";

                    if (!string.IsNullOrEmpty(customerPhone))
                    {
                        await _notificationService.SendTemplatedNotificationAsync(
                            "PAYMENT_REMINDER_OWNERSHIP",
                            customerPhone,
                            placeholders,
                            booking.CustomerId,
                            booking.Id,
                            booking.VehicleId);
                    }
                }
            }

            _logger.LogInformation("Ownership payment reminders completed. Reminders sent: {Count}", remindersSent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SendOwnershipPaymentRemindersAsync");
        }
    }

    /// <summary>
    /// Send renewal reminders for rental bookings
    /// </summary>
    public async Task SendRentalRenewalRemindersAsync(CancellationToken cancellationToken = default)
    {
        if (_bookingService == null || _settingsService == null || _notificationService == null)
        {
            _logger.LogWarning("Required services not available for SendRentalRenewalRemindersAsync");
            return;
        }

        try
        {
            _logger.LogInformation("Sending rental renewal reminders...");

            // Get grace period settings
            var gracePeriodSettings = await _settingsService.LoadSettingAsync<VehicleGracePeriodSettings>();
            int notificationDays = gracePeriodSettings?.NotificationDays ?? 3;

            // Get active rental bookings
            var bookings = await _bookingService.GetBookingsPagedAsync(
                page: 1,
                pageSize: 1000,
                bookingType: BookingType.Rental,
                bookingStatus: BookingStatus.VehicleAssigned);

            int remindersSent = 0;

            foreach (var booking in bookings.Items)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                if (booking.PlanExpiryDate == null || booking.CustomerId <= 0)
                    continue;

                var reminderDate = booking.PlanExpiryDate.Value.AddDays(-notificationDays);
                var today = DateTime.UtcNow.Date;

                // Send reminder on the notification day
                if (today == reminderDate.Date)
                {
                    // Check if notification was already sent today
                    bool alreadySent = await WasNotificationSentTodayAsync(booking.Id, "RENEWAL_REMINDER");
                    if (alreadySent)
                    {
                        _logger.LogDebug("Renewal reminder already sent today for Booking {BookingId}, skipping", booking.Id);
                        continue;
                    }

                    remindersSent++;
                    _logger.LogInformation("Sending renewal reminder for Booking {BookingId}", booking.Id);

                    var customerName = $"{booking.FirstName} {booking.LastName}".Trim();
                    var placeholders = new Dictionary<string, string>
                    {
                        { "CustomerName", customerName },
                        { "PlanName", booking.RentalPlanName ?? "Rental Plan" },
                        { "ExpiryDate", booking.PlanExpiryDate.Value.ToString("dd-MMM-yyyy") },
                        { "BookingId", booking.Id.ToString() }
                    };

                    // Get customer phone from booking
                    string customerPhone = booking.PhoneNumber ?? "";

                    if (!string.IsNullOrEmpty(customerPhone))
                    {
                        await _notificationService.SendTemplatedNotificationAsync(
                            "RENEWAL_REMINDER_RENTAL",
                            customerPhone,
                            placeholders,
                            booking.CustomerId,
                            booking.Id,
                            booking.VehicleId);
                    }
                }
            }

            _logger.LogInformation("Rental renewal reminders completed. Reminders sent: {Count}", remindersSent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SendRentalRenewalRemindersAsync");
        }
    }

    #region Helper Methods

    /// <summary>
    /// Turn off scooter engine via GPRS Server API
    /// </summary>
    private async Task TurnOffScooterEngineAsync(int scooterId, int bookingId, string reason, CancellationToken cancellationToken)
    {
        if (_httpClientFactory == null || _configuration == null || _vehicleService == null)
        {
            _logger.LogWarning("Required services not available for engine control");
            return;
        }

        try
        {
            // Get scooter details to retrieve IMEI
            var scooter = await _vehicleService.GetByIdAsync(scooterId);
            if (scooter?.TrackerDevice == null || string.IsNullOrWhiteSpace(scooter.TrackerDevice.IMEI))
            {
                _logger.LogWarning("Vehicle {VehicleId} does not have a TrackerDevice with IMEI", scooterId);
                return;
            }

            string identifier = scooter.TrackerDevice.IMEI;
            string baseUrl = _configuration.GetValue<string>("GprsServer:CommandApiUrl") ?? "http://localhost:8182/";
            if (!baseUrl.EndsWith("/", StringComparison.Ordinal))
            {
                baseUrl += "/";
            }

            string requestUrl = $"{baseUrl}engine/off?identifier={Uri.EscapeDataString(identifier)}";

            var client = _httpClientFactory.CreateClient();
            using var response = await client.PostAsync(requestUrl, content: null, cancellationToken);
            var payload = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Engine turned off for Scooter {ScooterId} (IMEI: {Identifier}) due to: {Reason}. Response: {Response}", 
                    scooterId, identifier, reason, payload);
            }
            else
            {
                _logger.LogWarning("Failed to turn off engine for Scooter {ScooterId} (IMEI: {Identifier}). Status: {Status}, Response: {Response}", 
                    scooterId, identifier, response.StatusCode, payload);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error turning off engine for Scooter {ScooterId}", scooterId);
        }
    }

    /// <summary>
    /// Turn on scooter engine via GPRS Server API
    /// </summary>
    private async Task TurnOnScooterEngineAsync(int scooterId, int bookingId, string reason, CancellationToken cancellationToken)
    {
        if (_httpClientFactory == null || _configuration == null || _vehicleService == null)
        {
            _logger.LogWarning("Required services not available for engine control");
            return;
        }

        try
        {
            // Get scooter details to retrieve IMEI
            var scooter = await _vehicleService.GetByIdAsync(scooterId);
            if (scooter?.TrackerDevice == null || string.IsNullOrWhiteSpace(scooter.TrackerDevice.IMEI))
            {
                _logger.LogWarning("Vehicle {VehicleId} does not have a TrackerDevice with IMEI", scooterId);
                return;
            }

            string identifier = scooter.TrackerDevice.IMEI;
            string baseUrl = _configuration.GetValue<string>("GprsServer:CommandApiUrl") ?? "http://localhost:8182/";
            if (!baseUrl.EndsWith("/", StringComparison.Ordinal))
            {
                baseUrl += "/";
            }

            string requestUrl = $"{baseUrl}engine/on?identifier={Uri.EscapeDataString(identifier)}";

            var client = _httpClientFactory.CreateClient();
            using var response = await client.PostAsync(requestUrl, content: null, cancellationToken);
            var payload = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Engine turned on for Scooter {ScooterId} (IMEI: {Identifier}) due to: {Reason}. Response: {Response}", 
                    scooterId, identifier, reason, payload);
            }
            else
            {
                _logger.LogWarning("Failed to turn on engine for Scooter {ScooterId} (IMEI: {Identifier}). Status: {Status}, Response: {Response}", 
                    scooterId, identifier, response.StatusCode, payload);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error turning on engine for Scooter {ScooterId}", scooterId);
        }
    }

    /// <summary>
    /// Send engine off notification to customer
    /// </summary>
    private async Task SendEngineOffNotificationAsync(BookingPagedReadDto booking, string reason)
    {
        if (_notificationService == null)
            return;

        try
        {
            var message = $"Your vehicle (Booking #{booking.Id}) has been disabled due to {reason}. " +
                         $"Please contact support or make payment to resume service.";

            string customerPhone = booking.PhoneNumber ?? "";

            if (!string.IsNullOrEmpty(customerPhone))
            {
                // Get ENGINE_CONTROL notification type
                var notificationType = await _notificationService.GetNotificationTypeByCodeAsync("ENGINE_CONTROL");

                await _notificationService.SendCustomNotificationAsync(
                    notificationType?.Id,
                    NotificationChannel.WhatsApp,
                    customerPhone,
                    "Vehicle Service Alert",
                    message,
                    booking.CustomerId,
                    null,
                    booking.Id,
                    booking.VehicleId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError("Error sending engine off notification for Booking {BookingId}: {Error}", 
                booking.Id, ex.Message);
        }
    }

    /// <summary>
    /// Check if alarm type is significant enough to notify admins
    /// </summary>
    private async Task<bool> IsAlarmTypeSignificantAsync(string alarmType)
    {
        if (_settingsService == null)
            return false;

        try
        {
            // Load alarm settings from database
            var alarmSettings = await _settingsService.LoadSettingAsync<AlarmSettings>();

            if (alarmSettings == null || string.IsNullOrWhiteSpace(alarmSettings.SignificantAlarms))
                return false;

            // Split comma-delimited string into array
            var significantAlarms = alarmSettings.SignificantAlarms
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(a => a.Trim())
                .ToArray();

            return significantAlarms.Any(a => alarmType.Contains(a, StringComparison.OrdinalIgnoreCase));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking alarm significance for alarm type: {AlarmType}", alarmType);
            return false;
        }
    }

    /// <summary>
    /// Checks engine override and applies appropriate action based on override setting.
    /// Returns true if override allows the requested action, false if override prevents it.
    /// </summary>
    private async Task<bool> ShouldApplyEngineControlAsync(int scooterId, bool wantToTurnOff, CancellationToken cancellationToken)
    {
        if (_vehicleService == null)
            return true; // If service unavailable, allow automated control

        try
        {
            var scooter = await _vehicleService.GetByIdAsync(scooterId);
            if (scooter == null)
                return true; // If scooter not found, allow automated control

            switch (scooter.EngineOverride)
            {
                case EngineOverride.EngineOn:
                    // Override is ON - don't allow turning off, but allow turning on
                    if (wantToTurnOff)
                    {
                        _logger.LogInformation("Vehicle {VehicleId} has EngineOverride=EngineOn, preventing automated engine off", scooterId);
                        return false;
                    }
                    return true;

                case EngineOverride.EngineOff:
                    // Override is OFF - don't allow turning on, but allow turning off
                    if (!wantToTurnOff)
                    {
                        _logger.LogInformation("Vehicle {VehicleId} has EngineOverride=EngineOff, preventing automated engine on", scooterId);
                        return false;
                    }
                    return true;

                case EngineOverride.System:
                default:
                    // System mode - allow automated control
                    return true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking engine override for Scooter {ScooterId}", scooterId);
            return true; // On error, allow automated control to proceed
        }
    }

    /// <summary>
    /// Check if a notification was already sent today for a specific booking and notification type code
    /// </summary>
    private async Task<bool> WasNotificationSentTodayAsync(int bookingId, string notificationTypeCode)
    {
        if (_notificationRepository == null || _notificationService == null)
            return false;

        try
        {
            var notificationType = await _notificationService.GetNotificationTypeByCodeAsync(notificationTypeCode);
            if (notificationType == null)
                return false;

            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            var existingNotification = await _notificationRepository.FirstOrDefaultAsync(
                n => n.BookingId == bookingId 
                    && n.NotificationTypeId == notificationType.Id
                    && n.CreatedAt >= today 
                    && n.CreatedAt < tomorrow
                    && n.IsSent);

            return existingNotification != null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking notification history for Booking {BookingId}", bookingId);
            return false; // If check fails, allow sending to avoid blocking notifications
        }
    }

    /// <summary>
    /// Clear old GPRS history data keeping only the recent N days based on GPRSSettings.KeepGPRSHistoryDays
    /// Deletes old GprsHeartbeatHistories, GprsLocationHistories, and GprsTerminalHistories
    /// </summary>
    public async Task ClearGPRSHistoryDataAsync(CancellationToken cancellationToken = default)
    {
        if (_unitOfWork == null || _settingsService == null)
        {
            _logger.LogWarning("Required services not available for ClearGPRSHistoryDataAsync");
            return;
        }

        try
        {
            _logger.LogInformation("Starting GPRS history cleanup...");

            // Load GPRS settings to get retention days
            var gprsSettings = await _settingsService.LoadSettingAsync<GPRSSettings>();
            var keepDays = gprsSettings?.KeepGPRSHistoryDays ?? 4;

            // Calculate cutoff date - delete data older than this date
            var cutoffDate = DateTime.UtcNow.AddDays(-keepDays);

            // Delete old heartbeat history records
            var oldHeartbeatRecords = await _unitOfWork.GprsHeartbeatHistories.FindAsync(
                h => h.CreatedAtUtc < cutoffDate);
            
            int heartbeatDeleted = 0;
            foreach (var record in oldHeartbeatRecords)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;
                await _unitOfWork.GprsHeartbeatHistories.DeleteAsync(record);
                heartbeatDeleted++;
            }

            // Delete old location history records
            var oldLocationRecords = await _unitOfWork.GprsLocationHistories.FindAsync(
                l => l.CreatedAtUtc < cutoffDate);
            
            int locationDeleted = 0;
            foreach (var record in oldLocationRecords)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;
                await _unitOfWork.GprsLocationHistories.DeleteAsync(record);
                locationDeleted++;
            }

            // Delete old terminal history records
            var oldTerminalRecords = await _unitOfWork.GprsTerminalHistories.FindAsync(
                t => t.CreatedAtUtc < cutoffDate);
            
            int terminalDeleted = 0;
            foreach (var record in oldTerminalRecords)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;
                await _unitOfWork.GprsTerminalHistories.DeleteAsync(record);
                terminalDeleted++;
            }

            // Save all deletions
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation(
                "GPRS history cleanup completed. Deleted: Heartbeat={HeartbeatCount}, Location={LocationCount}, Terminal={TerminalCount} records older than {CutoffDate}",
                heartbeatDeleted, locationDeleted, terminalDeleted, cutoffDate);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ClearGPRSHistoryDataAsync");
        }
    }

    #endregion
}

namespace Scootr.Manager.Service;

/// <summary>
/// Service interface for scheduled job operations.
/// Implement this interface to add custom job logic to the worker service.
/// </summary>
public interface IScootrJobService
{
    /// <summary>
    /// Execute a scheduled job task.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Task result</returns>
    Task ExecuteAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Monitor all assigned scooters and check for alarms via GPRS service.
    /// Send notifications to admin users when alarms are detected.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Task result</returns>
    Task MonitorScooterAlarmsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Check ownership bookings for overdue payments (NextPaymentDate + GracePeriod exceeded).
    /// Turn off engine for scooters with overdue payments.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Task result</returns>
    Task CheckOwnershipPaymentOverdueAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Check rental bookings with VehicleReturnedPending status.
    /// Turn off engine if PlanExpiryDate + GracePeriod has passed.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Task result</returns>
    Task CheckRentalReturnOverdueAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Send payment reminders for ownership bookings.
    /// Notification sent when NextPaymentDate - NotificationDays is reached.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Task result</returns>
    Task SendOwnershipPaymentRemindersAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Send renewal reminders for rental bookings.
    /// Notification sent when PlanExpiryDate - NotificationDays is reached.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Task result</returns>
    Task SendRentalRenewalRemindersAsync(CancellationToken cancellationToken = default);
}


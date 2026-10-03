using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Scootr.Core.Domain.Notifications;
using Scootr.Data;
using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace ScootrApi.Controllers
{
    /// <summary>
    /// Webhook controller for receiving callbacks from Meta WhatsApp Cloud API
    /// Handles message status updates, user events, and business account events
    /// </summary>
    [AllowAnonymous]
    [Route("api/[controller]")]
    [ApiController]
    public class WhatsAppWebhookController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<WhatsAppWebhookController> _logger;
        private readonly string _webhookVerifyToken;

        public WhatsAppWebhookController(
            AppDbContext context,
            IConfiguration configuration,
            ILogger<WhatsAppWebhookController> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _webhookVerifyToken = _configuration["WhatsApp:WebhookVerifyToken"] ?? "scootr_webhook_token_2024";
        }

        /// <summary>
        /// Webhook verification endpoint (GET)
        /// Meta WhatsApp will call this to verify the webhook URL
        /// </summary>
        [HttpGet]
        public IActionResult VerifyWebhook(
            [FromQuery(Name = "hub.mode")] string mode,
            [FromQuery(Name = "hub.verify_token")] string token,
            [FromQuery(Name = "hub.challenge")] string challenge)
        {
            _logger.LogInformation("Webhook verification request received. Mode: {Mode}, Token: {Token}", mode, token);

            if (mode == "subscribe" && token == _webhookVerifyToken)
            {
                _logger.LogInformation("Webhook verified successfully");
                return Ok(challenge);
            }
            else
            {
                _logger.LogWarning("Webhook verification failed. Invalid token.");
                return Unauthorized();
            }
        }

        /// <summary>
        /// Webhook callback endpoint (POST)
        /// Receives events from WhatsApp Cloud API
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> ReceiveWebhook()
        {
            try
            {
                // Read raw body
                string requestBody;
                using (var reader = new StreamReader(Request.Body))
                {
                    requestBody = await reader.ReadToEndAsync();
                }

                _logger.LogInformation("WhatsApp webhook received: {Body}", requestBody);

                // Get client information
                var sourceIp = HttpContext.Connection.RemoteIpAddress?.ToString();
                var userAgent = Request.Headers["User-Agent"].ToString();

                // Parse the webhook payload
                var webhookData = JsonSerializer.Deserialize<JsonElement>(requestBody);

                if (!webhookData.TryGetProperty("entry", out var entries))
                {
                    _logger.LogWarning("Webhook payload missing 'entry' field");
                    return Ok(); // Return 200 to acknowledge receipt
                }

                foreach (var entry in entries.EnumerateArray())
                {
                    await ProcessWebhookEntry(entry, requestBody, sourceIp, userAgent);
                }

                return Ok(); // Always return 200 to acknowledge receipt
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing WhatsApp webhook");
                // Still return 200 to prevent Meta from retrying
                return Ok();
            }
        }

        private async Task ProcessWebhookEntry(JsonElement entry, string rawPayload, string? sourceIp, string? userAgent)
        {
            try
            {
                string? businessAccountId = null;
                if (entry.TryGetProperty("id", out var idProp))
                {
                    businessAccountId = idProp.GetString();
                }

                if (!entry.TryGetProperty("changes", out var changes))
                {
                    return;
                }

                foreach (var change in changes.EnumerateArray())
                {
                    await ProcessWebhookChange(change, businessAccountId, rawPayload, sourceIp, userAgent);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing webhook entry");
            }
        }

        private async Task ProcessWebhookChange(
            JsonElement change,
            string? businessAccountId,
            string rawPayload,
            string? sourceIp,
            string? userAgent)
        {
            try
            {
                if (!change.TryGetProperty("value", out var value))
                {
                    return;
                }

                string? phoneNumberId = null;
                if (value.TryGetProperty("metadata", out var metadata))
                {
                    if (metadata.TryGetProperty("phone_number_id", out var phoneNumId))
                    {
                        phoneNumberId = phoneNumId.GetString();
                    }
                }

                // Check if this is a message status update
                if (value.TryGetProperty("statuses", out var statuses))
                {
                    await ProcessMessageStatuses(statuses, businessAccountId, phoneNumberId, rawPayload, sourceIp, userAgent);
                }

                // Check if this is an incoming message
                if (value.TryGetProperty("messages", out var messages))
                {
                    await ProcessIncomingMessages(messages, businessAccountId, phoneNumberId, rawPayload, sourceIp, userAgent);
                }

                // Check for other event types (contacts, errors, etc.)
                await ProcessOtherEvents(value, businessAccountId, phoneNumberId, rawPayload, sourceIp, userAgent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing webhook change");
            }
        }

        private async Task ProcessMessageStatuses(
            JsonElement statuses,
            string? businessAccountId,
            string? phoneNumberId,
            string rawPayload,
            string? sourceIp,
            string? userAgent)
        {
            foreach (var status in statuses.EnumerateArray())
            {
                try
                {
                    var webhookEvent = new WhatsAppWebhookEvent
                    {
                        EventType = "message_status",
                        WhatsAppBusinessAccountId = businessAccountId,
                        PhoneNumberId = phoneNumberId,
                        RawPayload = rawPayload,
                        SourceIp = sourceIp,
                        UserAgent = userAgent,
                        CreatedAt = DateTime.UtcNow
                    };

                    if (status.TryGetProperty("id", out var messageId))
                    {
                        webhookEvent.MessageId = messageId.GetString();
                    }

                    if (status.TryGetProperty("status", out var messageStatus))
                    {
                        webhookEvent.MessageStatus = messageStatus.GetString();
                    }

                    if (status.TryGetProperty("recipient_id", out var recipientId))
                    {
                        webhookEvent.UserPhoneNumber = recipientId.GetString();
                    }

                    if (status.TryGetProperty("timestamp", out var timestamp))
                    {
                        var unixTimestamp = timestamp.GetInt64();
                        webhookEvent.WhatsAppTimestamp = DateTimeOffset.FromUnixTimeSeconds(unixTimestamp).DateTime;
                    }

                    // Try to find the related notification
                    if (!string.IsNullOrEmpty(webhookEvent.MessageId))
                    {
                        var notification = await _context.Notifications
                            .Where(n => n.ExternalMessageId == webhookEvent.MessageId)
                            .FirstOrDefaultAsync();

                        if (notification != null)
                        {
                            webhookEvent.NotificationId = notification.Id;
                            webhookEvent.CustomerId = notification.CustomerId;

                            // Update notification status
                            if (webhookEvent.MessageStatus == "delivered" && !notification.IsSent)
                            {
                                notification.IsSent = true;
                                notification.SentAt = DateTime.UtcNow;
                                _context.Notifications.Update(notification);
                            }
                            else if (webhookEvent.MessageStatus == "read" && !notification.IsRead)
                            {
                                notification.IsRead = true;
                                notification.ReadAt = DateTime.UtcNow;
                                _context.Notifications.Update(notification);
                            }
                            else if (webhookEvent.MessageStatus == "failed")
                            {
                                notification.IsSent = false;
                                notification.ErrorMessage = "Message delivery failed (webhook)";
                                _context.Notifications.Update(notification);
                            }
                        }
                    }

                    _context.WhatsAppWebhookEvents.Add(webhookEvent);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Message status webhook processed: MessageId={MessageId}, Status={Status}",
                        webhookEvent.MessageId, webhookEvent.MessageStatus);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing message status");
                }
            }
        }

        private async Task ProcessIncomingMessages(
            JsonElement messages,
            string? businessAccountId,
            string? phoneNumberId,
            string rawPayload,
            string? sourceIp,
            string? userAgent)
        {
            foreach (var message in messages.EnumerateArray())
            {
                try
                {
                    var webhookEvent = new WhatsAppWebhookEvent
                    {
                        EventType = "incoming_message",
                        WhatsAppBusinessAccountId = businessAccountId,
                        PhoneNumberId = phoneNumberId,
                        RawPayload = rawPayload,
                        SourceIp = sourceIp,
                        UserAgent = userAgent,
                        CreatedAt = DateTime.UtcNow
                    };

                    if (message.TryGetProperty("id", out var messageId))
                    {
                        webhookEvent.MessageId = messageId.GetString();
                    }

                    if (message.TryGetProperty("from", out var from))
                    {
                        webhookEvent.UserPhoneNumber = from.GetString();
                    }

                    if (message.TryGetProperty("timestamp", out var timestamp))
                    {
                        var unixTimestamp = timestamp.GetInt64();
                        webhookEvent.WhatsAppTimestamp = DateTimeOffset.FromUnixTimeSeconds(unixTimestamp).DateTime;
                    }

                    // Try to match customer by phone number
                    if (!string.IsNullOrEmpty(webhookEvent.UserPhoneNumber))
                    {
                        var customer = await _context.Customers
                            .Where(c => c.PhoneNumber.Contains(webhookEvent.UserPhoneNumber) ||
                                       webhookEvent.UserPhoneNumber.Contains(c.PhoneNumber))
                            .FirstOrDefaultAsync();

                        if (customer != null)
                        {
                            webhookEvent.CustomerId = customer.Id;
                        }
                    }

                    _context.WhatsAppWebhookEvents.Add(webhookEvent);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Incoming message webhook processed: MessageId={MessageId}, From={From}",
                        webhookEvent.MessageId, webhookEvent.UserPhoneNumber);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing incoming message");
                }
            }
        }

        private async Task ProcessOtherEvents(
            JsonElement value,
            string? businessAccountId,
            string? phoneNumberId,
            string rawPayload,
            string? sourceIp,
            string? userAgent)
        {
            try
            {
                // Handle other event types like account updates, errors, etc.
                string eventType = "other";

                if (value.TryGetProperty("contacts", out _))
                {
                    eventType = "contact_update";
                }
                else if (value.TryGetProperty("errors", out _))
                {
                    eventType = "error";
                }

                if (eventType != "other")
                {
                    var webhookEvent = new WhatsAppWebhookEvent
                    {
                        EventType = eventType,
                        WhatsAppBusinessAccountId = businessAccountId,
                        PhoneNumberId = phoneNumberId,
                        RawPayload = rawPayload,
                        SourceIp = sourceIp,
                        UserAgent = userAgent,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.WhatsAppWebhookEvents.Add(webhookEvent);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("WhatsApp webhook event processed: Type={EventType}", eventType);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing other webhook events");
            }
        }

        /// <summary>
        /// Get all webhook events (for admin/debugging)
        /// </summary>
        [HttpGet("events")]
        public async Task<ActionResult> GetWebhookEvents(
            [FromQuery] int pageSize = 50,
            [FromQuery] int pageNumber = 1,
            [FromQuery] string? eventType = null)
        {
            try
            {
                var query = _context.WhatsAppWebhookEvents.AsQueryable();

                if (!string.IsNullOrEmpty(eventType))
                {
                    query = query.Where(e => e.EventType == eventType);
                }

                var total = await query.CountAsync();
                var events = await query
                    .OrderByDescending(e => e.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new
                {
                    total,
                    pageNumber,
                    pageSize,
                    events
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving webhook events");
                return StatusCode(500, new { message = "Failed to retrieve webhook events", error = ex.Message });
            }
        }
    }
}

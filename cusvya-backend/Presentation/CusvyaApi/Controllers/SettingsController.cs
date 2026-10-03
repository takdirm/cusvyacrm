using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Scootr.Core.Domain.Settings;
using Scootr.Data.Services.Settings;
using System;
using System.IO;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace ScootrApi.Controllers
{
	[Authorize]
	[ApiController]
	[Route("api/[Controller]/[action]")]
	public class SettingsController : ControllerBase
	{
		private readonly ISettingsService _settingsService;
		private readonly string _companyAssetRoot;

		public SettingsController(ISettingsService settingsService)
		{
			_settingsService = settingsService;
			_companyAssetRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "document", "company");
			Directory.CreateDirectory(_companyAssetRoot);
		}

		[HttpGet]
		public async Task<ActionResult<CompanySettings>> GetCompanySettings()
		{
			var settings = await _settingsService.LoadSettingAsync<CompanySettings>();
			return Ok(settings);
		}

		[HttpPost]
		[Consumes("multipart/form-data")]
		public async Task<ActionResult<CompanySettings>> UpdateCompanySettings([FromForm] IFormCollection form, IFormFile companyLogoFile = null, IFormFile authorisedSignatoryFile = null)
		{
			var model = new CompanySettings
			{
				CompanyName = GetString(form, "companyName"),
				Address = GetString(form, "address"),
				City = GetString(form, "city"),
				State = GetString(form, "state"),
				Country = GetString(form, "country", "India"),
				Pincode = GetString(form, "pincode"),
				GSTNumber = GetString(form, "gstNumber"),
				PANNumber = GetString(form, "panNumber"),
				CINNumber = GetString(form, "cinNumber"),
				Email = GetString(form, "email"),
				PhoneNumber = GetString(form, "phoneNumber"),
				Website = GetString(form, "website"),
				SupportEmail = GetString(form, "supportEmail"),
				SupportPhoneNumber = GetString(form, "supportPhoneNumber"),
				SupportWhatsAppNumber = GetString(form, "supportWhatsAppNumber"),
				EmergencyContactNumber = GetString(form, "emergencyContactNumber"),
				TermsAndConditionsUrl = GetString(form, "termsAndConditionsUrl"),
				PrivacyPolicyUrl = GetString(form, "privacyPolicyUrl"),
				CancellationPolicyUrl = GetString(form, "cancellationPolicyUrl"),
				InvoicePrefix = GetString(form, "invoicePrefix", "SCOOTR-INV"),
				InvoiceStartingNumber = GetInt(form, "invoiceStartingNumber", 1),
				BookingPrefix = GetString(form, "bookingPrefix", "SCOOTR"),
				BookingStartingNumber = GetInt(form, "bookingStartingNumber", 1),
				Currency = GetString(form, "currency", "INR"),
				CurrencySymbol = GetString(form, "currencySymbol", "₹"),
				TimeZone = GetString(form, "timeZone", "Asia/Kolkata"),
				IsTaxEnabled = GetBool(form, "isTaxEnabled", true),
				DefaultTaxRate = GetDecimal(form, "defaultTaxRate", 0),
				DefaultRentalTaxRate = GetDecimal(form, "defaultRentalTaxRate", 0),
				BusinessHoursStart = ParseTimeSpan(GetString(form, "businessHoursStart"), new TimeSpan(9, 0, 0)),
				BusinessHoursEnd = ParseTimeSpan(GetString(form, "businessHoursEnd"), new TimeSpan(20, 0, 0)),
				InvoiceFooter = GetString(form, "invoiceFooter")
			};

			var existing = await _settingsService.LoadSettingAsync<CompanySettings>();
			var updated = existing ?? new CompanySettings();

			updated.CompanyName = model.CompanyName;
			updated.Address = model.Address;
			updated.City = model.City;
			updated.State = model.State;
			updated.Country = string.IsNullOrWhiteSpace(model.Country) ? "India" : model.Country;
			updated.Pincode = model.Pincode;
			updated.GSTNumber = model.GSTNumber;
			updated.PANNumber = model.PANNumber;
			updated.CINNumber = model.CINNumber;
			updated.Email = model.Email;
			updated.PhoneNumber = model.PhoneNumber;
			updated.Website = model.Website;
			updated.SupportEmail = model.SupportEmail;
			updated.SupportPhoneNumber = model.SupportPhoneNumber;
			updated.SupportWhatsAppNumber = model.SupportWhatsAppNumber;
			updated.EmergencyContactNumber = model.EmergencyContactNumber;
			updated.TermsAndConditionsUrl = model.TermsAndConditionsUrl;
			updated.PrivacyPolicyUrl = model.PrivacyPolicyUrl;
			updated.CancellationPolicyUrl = model.CancellationPolicyUrl;
			updated.InvoicePrefix = string.IsNullOrWhiteSpace(model.InvoicePrefix) ? "SCOOTR-INV" : model.InvoicePrefix;
			updated.InvoiceStartingNumber = model.InvoiceStartingNumber;
			updated.BookingPrefix = string.IsNullOrWhiteSpace(model.BookingPrefix) ? "SCOOTR" : model.BookingPrefix;
			updated.BookingStartingNumber = model.BookingStartingNumber;
			updated.Currency = string.IsNullOrWhiteSpace(model.Currency) ? "INR" : model.Currency;
			updated.CurrencySymbol = string.IsNullOrWhiteSpace(model.CurrencySymbol) ? "₹" : model.CurrencySymbol;
			updated.TimeZone = string.IsNullOrWhiteSpace(model.TimeZone) ? "Asia/Kolkata" : model.TimeZone;
			updated.IsTaxEnabled = model.IsTaxEnabled;
			updated.DefaultTaxRate = model.DefaultTaxRate;
			updated.DefaultRentalTaxRate = model.DefaultRentalTaxRate;
			updated.BusinessHoursStart = model.BusinessHoursStart;
			updated.BusinessHoursEnd = model.BusinessHoursEnd;
			updated.InvoiceFooter = model.InvoiceFooter;

			if (companyLogoFile != null && companyLogoFile.Length > 0)
			{
				var replacement = await TrySaveCompanyAssetAsync(companyLogoFile, existing?.CompanyLogo, "company-logo");
				if (replacement != null)
					updated.CompanyLogo = replacement;
			}

			if (authorisedSignatoryFile != null && authorisedSignatoryFile.Length > 0)
			{
				var replacement = await TrySaveCompanyAssetAsync(authorisedSignatoryFile, existing?.AuthorisedSignatory, "authorised-signatory");
				if (replacement != null)
					updated.AuthorisedSignatory = replacement;
			}

			if (!string.IsNullOrWhiteSpace(GetString(form, "companyLogo")) && companyLogoFile == null && string.IsNullOrWhiteSpace(existing?.CompanyLogo))
				updated.CompanyLogo = GetString(form, "companyLogo");

			if (!string.IsNullOrWhiteSpace(GetString(form, "authorisedSignatory")) && authorisedSignatoryFile == null && string.IsNullOrWhiteSpace(existing?.AuthorisedSignatory))
				updated.AuthorisedSignatory = GetString(form, "authorisedSignatory");

			await _settingsService.SaveSettingAsync(updated);
			return Ok(updated);
		}

		private static string GetString(IFormCollection form, string key, string defaultValue = "")
		{
			if (form == null || string.IsNullOrWhiteSpace(key))
				return defaultValue;

			if (form.TryGetValue(key, out var value) && value.Count > 0)
				return value[0]?.Trim() ?? defaultValue;

			return defaultValue;
		}

		private static int GetInt(IFormCollection form, string key, int defaultValue)
		{
			var value = GetString(form, key);
			return int.TryParse(value, out var parsed) ? parsed : defaultValue;
		}

		private static decimal GetDecimal(IFormCollection form, string key, decimal defaultValue)
		{
			var value = GetString(form, key);
			return decimal.TryParse(value, out var parsed) ? parsed : defaultValue;
		}

		private static bool GetBool(IFormCollection form, string key, bool defaultValue)
		{
			var value = GetString(form, key);
			if (string.IsNullOrWhiteSpace(value))
				return defaultValue;

			if (bool.TryParse(value, out var parsed))
				return parsed;

			return value.Equals("1", StringComparison.OrdinalIgnoreCase) || value.Equals("yes", StringComparison.OrdinalIgnoreCase);
		}

		private static TimeSpan ParseTimeSpan(string value, TimeSpan fallback)
		{
			if (string.IsNullOrWhiteSpace(value))
				return fallback;

			return TimeSpan.TryParse(value, out var parsed) ? parsed : fallback;
		}

		private async Task<string> TrySaveCompanyAssetAsync(IFormFile assetFile, string currentValue, string assetName)
		{
			if (assetFile == null || assetFile.Length == 0)
				return null;

			var extension = Path.GetExtension(assetFile.FileName);
			var normalizedExtension = string.IsNullOrWhiteSpace(extension) ? ".png" : extension;
			var fileName = $"{assetName}-{Guid.NewGuid():N}{normalizedExtension}";
			var filePath = Path.Combine(_companyAssetRoot, fileName);
			Directory.CreateDirectory(_companyAssetRoot);

			await using (var stream = System.IO.File.Create(filePath))
			{
				await assetFile.CopyToAsync(stream);
			}

			if (!string.IsNullOrWhiteSpace(currentValue))
			{
				var existingPath = ResolveAssetPhysicalPath(currentValue);
				if (!string.IsNullOrWhiteSpace(existingPath) && System.IO.File.Exists(existingPath))
				{
					try
					{
						using var currentFile = System.IO.File.OpenRead(existingPath);
						using var uploaded = assetFile.OpenReadStream();
						if (await FilesMatchAsync(currentFile, uploaded))
						{
							System.IO.File.Delete(filePath);
							return currentValue;
						}
					}
					catch
					{
						// Ignore comparison failures and continue replacing the old stored asset.
					}

					try
					{
						System.IO.File.Delete(existingPath);
					}
					catch
					{
						// Ignore stale file cleanup failures.
					}
				}
			}

			return "/document/company/" + fileName;
		}

		private static string ResolveAssetPhysicalPath(string value)
		{
			if (string.IsNullOrWhiteSpace(value))
				return null;

			if (Uri.TryCreate(value, UriKind.Absolute, out var absoluteUri) &&
				(absoluteUri.Scheme == Uri.UriSchemeHttp || absoluteUri.Scheme == Uri.UriSchemeHttps))
			{
				return null;
			}

			var normalized = value.Trim().TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
			var fullPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", normalized));
			var webRoot = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"));
			return fullPath.StartsWith(webRoot, StringComparison.OrdinalIgnoreCase) ? fullPath : null;
		}

		private static async Task<bool> FilesMatchAsync(Stream first, Stream second)
		{
			using var sha1 = SHA256.Create();
			var firstHash = await ComputeHashAsync(first, sha1);
			var secondHash = await ComputeHashAsync(second, sha1);
			return string.Equals(firstHash, secondHash, StringComparison.OrdinalIgnoreCase);
		}

		private static async Task<string> ComputeHashAsync(Stream stream, HashAlgorithm algorithm)
		{
			stream.Position = 0;
			var hash = await Task.Run(() => algorithm.ComputeHash(stream));
			return Convert.ToHexString(hash);
		}

		// ══════════════════════════════════════════════════════════════════════
		// PAYMENT SCHEDULE SETTINGS
		// ══════════════════════════════════════════════════════════════════════

		/// <summary>
		/// GET api/Settings/GetPaymentScheduleSettings
		/// Returns the current EMI payment schedule configuration.
		/// MonthlyEmiDayOfMonth: day of month (1-28) on which monthly EMIs are due.
		/// WeeklyEmiDayOfWeek:   day of week (0=Sunday ... 6=Saturday) on which weekly EMIs are due.
		/// </summary>
		[HttpGet]
		public async Task<ActionResult<PaymentScheduleSettings>> GetPaymentScheduleSettings()
		{
			var settings = await _settingsService.LoadSettingAsync<PaymentScheduleSettings>();
			return Ok(settings);
		}

		/// <summary>
		/// POST api/Settings/UpdatePaymentScheduleSettings
		/// Updates the EMI payment schedule configuration.
		/// MonthlyEmiDayOfMonth must be between 1 and 28.
		/// WeeklyEmiDayOfWeek must be between 0 (Sunday) and 6 (Saturday).
		/// </summary>
		[HttpPost]
		public async Task<ActionResult<PaymentScheduleSettings>> UpdatePaymentScheduleSettings([FromBody] PaymentScheduleSettings model)
		{
			if (model.MonthlyEmiDayOfMonth < 1 || model.MonthlyEmiDayOfMonth > 28)
				return BadRequest("MonthlyEmiDayOfMonth must be between 1 and 28.");

			if (model.WeeklyEmiDayOfWeek < 0 || model.WeeklyEmiDayOfWeek > 6)
				return BadRequest("WeeklyEmiDayOfWeek must be between 0 (Sunday) and 6 (Saturday).");

			await _settingsService.SaveSettingAsync(model);
			return Ok(model);
		}

		// ══════════════════════════════════════════════════════════════════════
		// SECURITY AMOUNT SETTINGS
		// ══════════════════════════════════════════════════════════════════════

		/// <summary>
		/// GET api/Settings/GetSecurityAmountSettings
		/// Returns the security deposit amounts collected at booking creation.
		/// OwnershipPlanSecurityAmount: deposit for Ownership plan bookings.
		/// OwnershipBookingFee:         fee for Ownership plan bookings.
		/// RentalPlanSecurityAmount:    deposit for Rental plan bookings.
		/// </summary>
		[HttpGet]
		public async Task<ActionResult<SecurityAmountSettings>> GetSecurityAmountSettings()
		{
			var settings = await _settingsService.LoadSettingAsync<SecurityAmountSettings>();
			return Ok(settings);
		}

		/// <summary>
		/// POST api/Settings/UpdateSecurityAmountSettings
		/// Updates the security deposit amounts. Both values must be zero or positive.
		/// </summary>
		[HttpPost]
		public async Task<ActionResult<SecurityAmountSettings>> UpdateSecurityAmountSettings([FromBody] SecurityAmountSettings model)
		{
			if (model.OwnershipPlanSecurityAmount < 0)
				return BadRequest("OwnershipPlanSecurityAmount must be zero or positive.");

			if (model.OwnershipBookingFee < 0)
				return BadRequest("OwnershipBookingFee must be zero or positive.");

			if (model.RentalPlanSecurityAmount < 0)
				return BadRequest("RentalPlanSecurityAmount must be zero or positive.");

					await _settingsService.SaveSettingAsync(model);
					return Ok(model);
				}

				// ══════════════════════════════════════════════════════════════════════
				// VEHICLE GRACE PERIOD SETTINGS
				// ══════════════════════════════════════════════════════════════════════

				/// <summary>
				/// GET api/Settings/GetVehicleGracePeriodSettings
				/// Returns grace period configurations for vehicle operations and payment deadlines.
				/// NumOfDaysRentalReturn: days after PlanExpiryDate before vehicle becomes non-usable (default: 1).
				/// NoOfDaysForMissingRepayment: days after NextPaymentDate before late payment fee is charged (default: 1).
				/// </summary>
				[HttpGet]
				public async Task<ActionResult<VehicleGracePeriodSettings>> GetVehicleGracePeriodSettings()
				{
					var settings = await _settingsService.LoadSettingAsync<VehicleGracePeriodSettings>();
					return Ok(settings);
				}

				/// <summary>
				/// POST api/Settings/UpdateVehicleGracePeriodSettings
				/// Updates grace period configurations. All values must be zero or positive.
				/// </summary>
				[HttpPost]
				public async Task<ActionResult<VehicleGracePeriodSettings>> UpdateVehicleGracePeriodSettings([FromBody] VehicleGracePeriodSettings model)
				{
					if (model.NumOfDaysRentalReturn < 0)
						return BadRequest("NumOfDaysRentalReturn must be zero or positive.");

					if (model.NoOfDaysForMissingRepayment < 0)
						return BadRequest("NoOfDaysForMissingRepayment must be zero or positive.");

								await _settingsService.SaveSettingAsync(model);
								return Ok(model);
							}

							// ══════════════════════════════════════════════════════════════════════
							// ALARM SETTINGS
							// ══════════════════════════════════════════════════════════════════════

							/// <summary>
							/// GET api/Settings/GetAlarmSettings
							/// Returns the current alarm settings configuration.
							/// SignificantAlarms: comma-delimited list of alarm types that trigger admin notifications.
							/// </summary>
							[HttpGet]
							public async Task<ActionResult<AlarmSettings>> GetAlarmSettings()
							{
								var settings = await _settingsService.LoadSettingAsync<AlarmSettings>();
								return Ok(settings);
							}

							/// <summary>
							/// POST api/Settings/UpdateAlarmSettings
							/// Updates alarm settings configuration.
							/// SignificantAlarms: comma-delimited list of alarm types (e.g., "THEFT,ACCIDENT,SOS").
							/// </summary>
							[HttpPost]
							public async Task<ActionResult<AlarmSettings>> UpdateAlarmSettings([FromBody] AlarmSettings model)
							{
												if (string.IsNullOrWhiteSpace(model.SignificantAlarms))
													return BadRequest("SignificantAlarms cannot be empty.");

												await _settingsService.SaveSettingAsync(model);
												return Ok(model);
											}

										// ══════════════════════════════════════════════════════════════════════
										// WHATSAPP SETTINGS
										// ══════════════════════════════════════════════════════════════════════

										/// <summary>
										/// GET api/Settings/GetWhatsAppSettings
										/// Returns the WhatsApp Cloud API configuration settings.
										/// All WhatsApp notification settings including AccessToken, PhoneNumberId, ApiVersion, etc.
										/// </summary>
										[HttpGet]
										public async Task<ActionResult<WhatsAppSettings>> GetWhatsAppSettings()
										{
											var settings = await _settingsService.LoadSettingAsync<WhatsAppSettings>();
											return Ok(settings);
										}

										/// <summary>
										/// POST api/Settings/UpdateWhatsAppSettings
										/// Updates the WhatsApp Cloud API configuration settings.
										/// Allows updating AccessToken, PhoneNumberId, and other WhatsApp settings without application restart.
										/// </summary>
										[HttpPost]
										public async Task<ActionResult<WhatsAppSettings>> UpdateWhatsAppSettings([FromBody] WhatsAppSettings model)
										{
											if (string.IsNullOrWhiteSpace(model.AccessToken))
												return BadRequest("AccessToken is required.");

											if (string.IsNullOrWhiteSpace(model.PhoneNumberId))
												return BadRequest("PhoneNumberId is required.");

											if (string.IsNullOrWhiteSpace(model.ApiVersion))
												return BadRequest("ApiVersion is required.");

											if (string.IsNullOrWhiteSpace(model.ApiBaseUrl))
												return BadRequest("ApiBaseUrl is required.");

											await _settingsService.SaveSettingAsync(model);
											return Ok(model);
										}

										// ══════════════════════════════════════════════════════════════════════
										// GPRS SETTINGS
										// ══════════════════════════════════════════════════════════════════════

										/// <summary>
										/// GET api/Settings/GetGPRSSettings
										/// Returns the GPRS history retention configuration settings.
										/// KeepGPRSHistoryDays: number of days to keep GPRS history data before cleanup (default: 4).
										/// </summary>
										[HttpGet]
										public async Task<ActionResult<GPRSSettings>> GetGPRSSettings()
										{
											var settings = await _settingsService.LoadSettingAsync<GPRSSettings>();
											return Ok(settings ?? new GPRSSettings { KeepGPRSHistoryDays = 4 });
										}

										/// <summary>
										/// POST api/Settings/UpdateGPRSSettings
										/// Updates the GPRS history retention configuration settings.
										/// KeepGPRSHistoryDays must be greater than 0.
										/// </summary>
										[HttpPost]
										public async Task<ActionResult<GPRSSettings>> UpdateGPRSSettings([FromBody] GPRSSettings model)
										{
											if (model.KeepGPRSHistoryDays <= 0)
												return BadRequest("KeepGPRSHistoryDays must be greater than 0.");

											await _settingsService.SaveSettingAsync(model);
											return Ok(model);
										}
									}
								}


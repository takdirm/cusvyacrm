using DocumentFormat.OpenXml.Spreadsheet;

using Microsoft.Exchange.WebServices.Data;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using Attachment = System.Net.Mail.Attachment;
using Microsoft.Exchange.WebServices.Data;
namespace Forecast.Ordering.MailingServices
{
    public class MailingService : IMailingService
    {
        #region Fields
        private readonly MailSettings _mailSettings;
        private readonly ISettingService _settingService;
        #endregion

        #region Ctor
        public MailingService(ISettingService settingService)
        {
          _settingService = settingService;
         _mailSettings = _settingService.GetMailSettings();
        }
		#endregion



		public void SendNoDataMail(string subject)
		{
			
			SendMail(subject, _mailSettings.NoDataBody);

			
		}


		/// <summary>
		/// Send Contact Us Mail
		/// </summary>
		/// <param name="Name"></param>
		/// <param name="fromMail"></param>
		/// <param name="bodytext"></param>
		public void SendReportMail(string subject, string reportName, Stream excelAttachedment)
		{
			var attachment = new Attachment(excelAttachedment, reportName);
			attachment.ContentType = new ContentType("application/vnd.ms-excel");
			SendMail(subject, _mailSettings.Body, attachment);

		}

		public void  SendMail(string subject, string body, Attachment attachment = null)
		{
			var mailClient = new SmtpClient(_mailSettings.MailServerName, _mailSettings.ServerPortAddress);
			mailClient.EnableSsl = _mailSettings.EnableSSL;
			mailClient.DeliveryFormat = SmtpDeliveryFormat.International;
			mailClient.DeliveryMethod = SmtpDeliveryMethod.Network;
			mailClient.UseDefaultCredentials = false;//SET THIS FIRST OR IT WIPES OUT CREDENTIALS
			NetworkCredential netCreds = new NetworkCredential(_mailSettings.SupportUserName, _mailSettings.SupportPassword);
			mailClient.Credentials = netCreds;
			MailMessage message = new MailMessage();
			message.SubjectEncoding = Encoding.UTF8;
			message.BodyEncoding = Encoding.UTF8;
			message.IsBodyHtml = true;
			message.From = new MailAddress(_mailSettings.SupportEmailAddress);
			var senders = _mailSettings.SenderEmailAddresses.Split(new[] { "," }, StringSplitOptions.RemoveEmptyEntries).ToList();
			if (senders.Count > 0)
			{


				foreach (var sender in senders)
				{
					message.To.Add(sender);

				}
			}
			else
			{
				throw new Exception("Error:Senders list is empty, please update sender email address in settings");
			}
			message.Subject = subject;
			message.Body = body;
			if (attachment != null)
			{
				
				attachment.ContentType = new ContentType("application/vnd.ms-excel");
				message.Attachments.Add(attachment);

			}
			
			mailClient.Send(message);


		

		}
		public  void SendTestMail()
		{
			var mailClient = new SmtpClient(_mailSettings.MailServerName, _mailSettings.ServerPortAddress);
			mailClient.EnableSsl = _mailSettings.EnableSSL;
			mailClient.DeliveryFormat = SmtpDeliveryFormat.International;
			mailClient.DeliveryMethod = SmtpDeliveryMethod.Network;

			mailClient.UseDefaultCredentials = false;//SET THIS FIRST OR IT WIPES OUT CREDENTIALS
			NetworkCredential netCreds = new NetworkCredential(_mailSettings.SupportUserName, _mailSettings.SupportPassword);
			mailClient.Credentials = netCreds;

			MailMessage message = new MailMessage();
			message.SubjectEncoding = Encoding.UTF8;
			message.BodyEncoding = Encoding.UTF8;
			message.IsBodyHtml = false;

			message.From = new MailAddress(_mailSettings.SupportEmailAddress);
			var senders = _mailSettings.SenderEmailAddresses.Split(new[] { "," }, StringSplitOptions.RemoveEmptyEntries).ToList();
			if (senders.Count > 0)
			{


				foreach (var sender in senders)
				{
					message.To.Add(sender);

				}
			}
			else
			{
				throw new Exception("Error:Senders list is empty, please update sender email address in settings");
			}

			message.Subject = "testing " + DateTime.UtcNow;
			message.Body = "The quick brown fox jumped over the lazy dogs.";
			
			mailClient.Send(message);
		}


		


		private static bool RedirectionUrlValidationCallback(string redirectionUrl)
		{
			// The default for the validation callback is to reject the URL.
			bool result = false;
			Uri redirectionUri = new Uri(redirectionUrl);
			// Validate the contents of the redirection URL. In this simple validation
			// callback, the redirection URL is considered valid if it is using HTTPS
			// to encrypt the authentication credentials. 
			if (redirectionUri.Scheme == "https")
			{
				result = true;
			}
			return result;
		}

		


	}
}

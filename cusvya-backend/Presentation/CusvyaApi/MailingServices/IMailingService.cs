using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace Forecast.Ordering.MailingServices
{
   public interface IMailingService
    {


		/// <summary>
		/// send Report Mail
		/// </summary>
		/// <param name="Subject"></param>
		/// <param name="excelAttachedment"></param>
		void SendReportMail(string Subject, string reportName, Stream excelAttachedment);

		/// <summary>
		/// Send No Data Mail
		/// </summary>
		/// <param name="Subject"></param>
		void SendNoDataMail(string Subject);

		/// <summary>
		/// Send Mail
		/// </summary>
		/// <param name="subject"></param>
		/// <param name="body"></param>
		/// <param name="attachment"></param>
		void SendMail(string subject, string body, Attachment attachment = null);
		/// <summary>
		/// Send test Mail
		/// </summary>
		void SendTestMail();

	}
}

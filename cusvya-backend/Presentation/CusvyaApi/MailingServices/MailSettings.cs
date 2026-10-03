using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Forecast.Ordering.MailingServices
{
    public class MailSettings
    {

        public MailSettings()
        {
            MailServerName = "mail.fissionbitz.com";
           
            ServerPortAddress = 25;
         
            SupportUserName = "support@fissionbitz.com";
            SupportPassword = "M0b!l3Ph0n3";
           
            Body = @"Hi {0},
             Thankyou for demo request. We will get back to you  shortly.
             Regards,
             FissionBitz Team'";
        }
        /// <summary>
        /// Gets or sets the Mail server address
        /// </summary>e
        public string MailServerName { get; set; }
        /// <summary>
        /// Get or set the Port Address
        /// </summary>
        public int ServerPortAddress { get; set; }
     
        /// <summary>
        /// Get or set the Support UserName
        /// </summary>
        public string SupportUserName { get; set; }

        /// <summary>
        /// Get or set the Support Password.
        /// </summary>
        public string SupportPassword { get; set; }

        public string SupportEmailAddress { get; set; }

        public string SenderEmailAddresses { get; set; }

        public string Body { get; set; }

        public string NoDataBody { get; set; }


        public bool EnableSSL { get; set; }

    }
}

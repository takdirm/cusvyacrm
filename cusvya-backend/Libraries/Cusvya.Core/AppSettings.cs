using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Scootr.Core
{
    public class AppSettings
    {
        public int Port { get; set; } = 5321;
        public string Host { get; set; } = "localhost";
        public ConnectionStrings ConnectionStrings { get; set; } = new ConnectionStrings();

        #region Properties

        /// <summary>
        /// Gets or sets raw configuration parameters
        /// </summary>
        [JsonExtensionData]
        public Dictionary<string, JToken> Configuration { get; set; }

        #endregion
    }

    public class ConnectionStrings
    {
        public string DBConnString { get; set; }
    }

      
    }

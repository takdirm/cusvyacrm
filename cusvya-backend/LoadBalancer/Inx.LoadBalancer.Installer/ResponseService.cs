using System.Collections.Generic;
using System.Diagnostics;
namespace Inx.Net.Deploy.MsiInstaller
{
    public class ResponseService
    {
       public string ServiceName { get; set; }
       public string ServiceState { get; set; }
       public List<Process> RunningProcess { get; set; }
       public string Message { get; set; }
       public bool FoundServiceStopped { get; set; }
    }
}

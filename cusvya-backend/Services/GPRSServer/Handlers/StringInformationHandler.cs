using System;
using System.Text;
using Microsoft.Extensions.Logging;

namespace GprsServer.Handlers
{
    public class StringInformationHandler
    {
        private readonly ILogger<StringInformationHandler> _logger;

        public StringInformationHandler(ILogger<StringInformationHandler> logger)
        {
            _logger = logger;
        }

        public void Handle(ParsedPacket packet)
        {
            if (packet.Content.Length < 5)
            {
                Console.WriteLine("Invalid string information payload.");
                _logger.LogWarning("Invalid string information payload. Length: {Length}", packet.Content.Length);
                return;
            }

            uint serverFlag =
                ((uint)packet.Content[0] << 24) |
                ((uint)packet.Content[1] << 16) |
                ((uint)packet.Content[2] << 8) |
                packet.Content[3];

            byte infoType = packet.Content[4];

            int textOffset = 5;
            int textLength = packet.Content.Length - textOffset;
            string message = textLength > 0
                ? Encoding.ASCII.GetString(packet.Content, textOffset, textLength).TrimEnd('\0')
                : string.Empty;

            string infoMessage = $"String information received - ServerFlag: 0x{serverFlag:X8}, InfoType: 0x{infoType:X2}";
            Console.WriteLine(infoMessage);
            _logger.LogInformation(infoMessage);

            string deviceMessage = $"Device message: {message}";
            Console.WriteLine(deviceMessage);
            _logger.LogInformation(deviceMessage);
        }
    }
}

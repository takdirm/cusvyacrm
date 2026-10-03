using System;
using System.Text;
using Microsoft.Extensions.Logging;

namespace GprsServer.Handlers
{
    public class CommandReplyHandler
    {
        private readonly ILogger<CommandReplyHandler> _logger;

        public CommandReplyHandler(ILogger<CommandReplyHandler> logger)
        {
            _logger = logger;
        }

        public void Handle(ParsedPacket packet)
        {
            if (packet.Content.Length < 7)
            {
                Console.WriteLine("Invalid command reply payload.");
                _logger.LogWarning("Invalid command reply payload. Length: {Length}", packet.Content.Length);
                return;
            }

            byte commandLength = packet.Content[0];
            if (commandLength < 4 || packet.Content.Length < 1 + commandLength + 2)
            {
                Console.WriteLine("Invalid command reply length field.");
                _logger.LogWarning("Invalid command reply length field. CommandLength: {CommandLength}, ContentLength: {ContentLength}", commandLength, packet.Content.Length);
                return;
            }

            uint serverFlag =
                ((uint)packet.Content[1] << 24) |
                ((uint)packet.Content[2] << 16) |
                ((uint)packet.Content[3] << 8) |
                packet.Content[4];

            int commandBytesLength = commandLength - 4;
            string commandResponse = Encoding.ASCII.GetString(packet.Content, 5, commandBytesLength);
            ushort language = (ushort)((packet.Content[5 + commandBytesLength] << 8) | packet.Content[6 + commandBytesLength]);

            string replyInfo = $"Command reply received - ServerFlag: 0x{serverFlag:X8}, Language: 0x{language:X4}, Response: {commandResponse}";
            Console.WriteLine(replyInfo);
            _logger.LogInformation(replyInfo);

            string languageDecoded = $"Command reply language decoded - {PacketHumanizer.DescribeLanguage((byte)(language & 0xFF))}";
            Console.WriteLine(languageDecoded);
            _logger.LogDebug(languageDecoded);
        }
    }
}

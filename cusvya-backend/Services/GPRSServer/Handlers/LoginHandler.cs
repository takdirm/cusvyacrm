// Handlers/LoginHandler.cs
using System;
using System.Collections.Generic;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;

namespace GprsServer.Handlers
{
    public class LoginHandler
    {
        private readonly ILogger<LoginHandler> _logger;

        public LoginHandler(ILogger<LoginHandler> logger)
        {
            _logger = logger;
        }

        public void Handle(ParsedPacket packet, NetworkStream stream)
        {
            Console.WriteLine("Login packet received.");
            _logger.LogInformation("Login packet received.");

            string imei = PacketHumanizer.DecodeBcdImei(packet.Content);
            string terminalIdHex = PacketHumanizer.ToHex(packet.Content);

            Console.WriteLine($"Terminal ID (HEX): {terminalIdHex}");
            _logger.LogDebug("Terminal ID (HEX): {TerminalIdHex}", terminalIdHex);

            Console.WriteLine($"IMEI: {imei}");
            _logger.LogInformation("IMEI: {Imei}", imei);

            var response = BuildResponse(0x01, packet.Serial);
            stream.Write(response, 0, response.Length);

            string responseHex = PacketHumanizer.ToHex(response);
            Console.WriteLine($"Login response sent. TX Raw: {responseHex}");
            _logger.LogDebug("Login response sent. TX Raw: {ResponseHex}", responseHex);
        }

        private static byte[] BuildResponse(byte protocol, ushort serial)
        {
            List<byte> resp =
            [
                0x78, 0x78,
                0x05,
                protocol,
                (byte)(serial >> 8),
                (byte)(serial & 0xFF)
            ];

            ushort crc = CRCUtil.CRCITU(resp.ToArray(), 2, resp.Count - 2);
            resp.Add((byte)(crc >> 8));
            resp.Add((byte)(crc & 0xFF));
            resp.AddRange([0x0D, 0x0A]);
            return resp.ToArray();
        }
    }
}

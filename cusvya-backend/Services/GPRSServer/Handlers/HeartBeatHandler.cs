// Handlers/HeartbeatHandler.cs
using System;
using System.Collections.Generic;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;

namespace GprsServer.Handlers
{
    public class HeartbeatHandler
    {
        private readonly ILogger<HeartbeatHandler> _logger;

        public HeartbeatHandler(ILogger<HeartbeatHandler> logger)
        {
            _logger = logger;
        }

        public void Handle(ParsedPacket packet, NetworkStream stream)
        {
            Console.WriteLine("Heartbeat packet received.");
            _logger.LogInformation("Heartbeat packet received.");

            if (packet.Content.Length >= 5)
            {
                byte terminalInfo = packet.Content[0];
                byte voltage = packet.Content[1];
                byte gsm = packet.Content[2];
                ushort alarmLanguage = (ushort)((packet.Content[3] << 8) | packet.Content[4]);

                string rawStatus = $"Heartbeat status raw - TerminalInfo: 0x{terminalInfo:X2}, Voltage: {voltage}, GSM: {gsm}, Alarm/Language: 0x{alarmLanguage:X4}";
                Console.WriteLine(rawStatus);
                _logger.LogDebug(rawStatus);

                string decodedTerminal = $"Heartbeat status decoded - {PacketHumanizer.DescribeTerminalInfo(terminalInfo)}";
                Console.WriteLine(decodedTerminal);
                _logger.LogDebug(decodedTerminal);

                string decodedVoltage = $"Heartbeat voltage decoded - {PacketHumanizer.DescribeVoltage(voltage)}";
                Console.WriteLine(decodedVoltage);
                _logger.LogDebug(decodedVoltage);

                string decodedGsm = $"Heartbeat GSM decoded - {PacketHumanizer.DescribeGsmSignal(gsm)}";
                Console.WriteLine(decodedGsm);
                _logger.LogDebug(decodedGsm);

                string decodedAlarm = $"Heartbeat alarm/language decoded - {PacketHumanizer.DescribeAlarmLanguage(alarmLanguage)}";
                Console.WriteLine(decodedAlarm);
                _logger.LogDebug(decodedAlarm);
            }

            var response = BuildResponse(0x13, packet.Serial);
            stream.Write(response, 0, response.Length);

            string responseHex = $"Heartbeat response sent. TX Raw: {PacketHumanizer.ToHex(response)}";
            Console.WriteLine(responseHex);
            _logger.LogDebug(responseHex);
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

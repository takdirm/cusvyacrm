// Handlers/ExtendedHeartbeatHandler.cs
using System;
using System.Collections.Generic;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;

namespace GprsServer.Handlers
{
    /// <summary>
    /// Handles protocol 0x36 - Extended Heartbeat Packet (M-series / GT06N)
    /// Extends standard heartbeat (0x13) with external voltage parameters.
    /// </summary>
    public class ExtendedHeartbeatHandler
    {
        private readonly ILogger<ExtendedHeartbeatHandler> _logger;

        public ExtendedHeartbeatHandler(ILogger<ExtendedHeartbeatHandler> logger)
        {
            _logger = logger;
        }

        public void Handle(ParsedPacket packet, NetworkStream stream)
        {
            Console.WriteLine("Extended Heartbeat packet (0x36) received.");
            _logger.LogInformation("Extended Heartbeat packet (0x36) received.");

            if (packet.Content.Length >= 8)
            {
                byte terminalInfo = packet.Content[0];
                byte voltage = packet.Content[1];
                byte gsm = packet.Content[2];
                ushort alarmLanguage = (ushort)((packet.Content[3] << 8) | packet.Content[4]);

                string rawStatus = $"Extended Heartbeat status raw - TerminalInfo: 0x{terminalInfo:X2}, Voltage: {voltage}, GSM: {gsm}, Alarm/Language: 0x{alarmLanguage:X4}";
                Console.WriteLine(rawStatus);
                _logger.LogDebug(rawStatus);

                string decodedTerminal = $"Extended Heartbeat status decoded - {PacketHumanizer.DescribeTerminalInfo(terminalInfo)}";
                Console.WriteLine(decodedTerminal);
                _logger.LogDebug(decodedTerminal);

                string decodedVoltage = $"Extended Heartbeat voltage decoded - {PacketHumanizer.DescribeVoltage(voltage)}";
                Console.WriteLine(decodedVoltage);
                _logger.LogDebug(decodedVoltage);

                string decodedGsm = $"Extended Heartbeat GSM decoded - {PacketHumanizer.DescribeGsmSignal(gsm)}";
                Console.WriteLine(decodedGsm);
                _logger.LogDebug(decodedGsm);

                string decodedAlarm = $"Extended Heartbeat alarm/language decoded - {PacketHumanizer.DescribeAlarmLanguage(alarmLanguage)}";
                Console.WriteLine(decodedAlarm);
                _logger.LogDebug(decodedAlarm);

                // Extended fields: External voltage parameters
                // Bytes 5-6: Parameter ID (typically 0x0027 for external voltage)
                // Bytes 7-8: Length + Value
                if (packet.Content.Length >= 9)
                {
                    ushort paramId = (ushort)((packet.Content[5] << 8) | packet.Content[6]);
                    byte paramLength = packet.Content[7];

                    if (paramId == 0x0027 && paramLength > 0 && packet.Content.Length >= 8 + paramLength)
                    {
                        // External voltage value is magnified 100 times
                        int externalVoltageRaw = 0;
                        for (int i = 0; i < paramLength && i < 4; i++)
                        {
                            externalVoltageRaw = (externalVoltageRaw << 8) | packet.Content[8 + i];
                        }
                        decimal externalVoltage = externalVoltageRaw / 100.0m;
                        string voltageInfo = $"Extended Heartbeat external voltage - ID: 0x{paramId:X4}, Length: {paramLength}, Value: {externalVoltage} V (raw: {externalVoltageRaw})";
                        Console.WriteLine(voltageInfo);
                        _logger.LogDebug(voltageInfo);
                    }
                    else
                    {
                        string unknownParam = $"Extended Heartbeat unknown parameter - ID: 0x{paramId:X4}, Length: {paramLength}";
                        Console.WriteLine(unknownParam);
                        _logger.LogDebug(unknownParam);
                    }
                }
            }
            else
            {
                string shortPacket = $"Extended Heartbeat packet too short: {packet.Content.Length} bytes (expected >= 8)";
                Console.WriteLine(shortPacket);
                _logger.LogWarning(shortPacket);
            }

            var response = BuildResponse(0x36, packet.Serial);
            stream.Write(response, 0, response.Length);

            string responseHex = $"Extended Heartbeat response sent. TX Raw: {PacketHumanizer.ToHex(response)}";
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

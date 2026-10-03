// PacketParser.cs
using System;

namespace GprsServer
{
    public class ParsedPacket
    {
        public byte Protocol { get; set; }
        public ushort Serial { get; set; }
        public byte[] Content { get; set; } = [];
    }

    public static class PacketParser
    {
        public static ParsedPacket? Parse(byte[] packet)
        {
            if (packet.Length < 10)
            {
                return null;
            }

            bool isShortHeader = packet[0] == 0x78 && packet[1] == 0x78;
            bool isLongHeader = packet[0] == 0x79 && packet[1] == 0x79;
            if (!isShortHeader && !isLongHeader)
            {
                Console.WriteLine("Invalid start bits.");
                return null;
            }

            if (packet[^2] != 0x0D || packet[^1] != 0x0A)
            {
                Console.WriteLine("Invalid stop bits.");
                return null;
            }

            int length = isShortHeader
                ? packet[2]
                : (packet[2] << 8) | packet[3];

            int expectedLength = isShortHeader
                ? length + 5
                : length + 6;

            if (packet.Length != expectedLength)
            {
                Console.WriteLine($"Invalid packet length. Expected {expectedLength}, actual {packet.Length}.");
                return null;
            }

            int protocolIndex = isShortHeader ? 3 : 4;
            int contentIndex = protocolIndex + 1;
            int contentLength = length - 5;

            if (contentLength < 0)
            {
                return null;
            }

            byte protocol = packet[protocolIndex];
            ushort serial = (ushort)((packet[^6] << 8) | packet[^5]);
            ushort crcReceived = (ushort)((packet[^4] << 8) | packet[^3]);

            int crcStart = 2;
            int crcLength = isShortHeader
                ? length - 1
                : length;

            ushort crcCalculated = CRCUtil.CRCITU(packet, crcStart, crcLength);

            if (crcReceived != crcCalculated)
            {
                Console.WriteLine($"CRC failed. Received {crcReceived:X4}, calculated {crcCalculated:X4}.");
                return null;
            }

            byte[] content = new byte[contentLength];
            if (contentLength > 0)
            {
                Array.Copy(packet, contentIndex, content, 0, contentLength);
            }

            return new ParsedPacket
            {
                Protocol = protocol,
                Serial = serial,
                Content = content
            };
        }
    }
}

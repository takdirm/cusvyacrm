// CommandHandler.cs
using System;
using System.Collections.Generic;
using System.Net.Sockets;
using System.Text;

namespace GprsServer.Handlers
{
    public static class CommandHandler
    {
        private static readonly byte[] DefaultServerFlag = [0x00, 0x00, 0x00, 0x01];

        public static void SendEngineStop(NetworkStream stream, ushort serial)
        {
            SendCommand(stream, serial, "DYD,000000#");
        }

        public static void SendEngineResume(NetworkStream stream, ushort serial)
        {
            SendCommand(stream, serial, "HFYD,000000#");
        }

        public static void SendCommand(NetworkStream stream, ushort serial, string command)
        {
            byte[] commandBytes = Encoding.ASCII.GetBytes(command);
            byte lengthOfCommand = (byte)(DefaultServerFlag.Length + commandBytes.Length);
            const byte protocol = 0x80;
            byte[] language = [0x00, 0x02]; // English

            byte packetLength = (byte)(1 + 1 + lengthOfCommand + language.Length + 2 + 2);

            List<byte> packet =
            [
                0x78, 0x78,
                packetLength,
                protocol,
                lengthOfCommand
            ];

            packet.AddRange(DefaultServerFlag);
            packet.AddRange(commandBytes);
            packet.AddRange(language);
            packet.Add((byte)(serial >> 8));
            packet.Add((byte)(serial & 0xFF));

            ushort crc = CRCUtil.CRCITU(packet.ToArray(), 2, packet.Count - 2);
            packet.Add((byte)(crc >> 8));
            packet.Add((byte)(crc & 0xFF));
            packet.AddRange([0x0D, 0x0A]);

            stream.Write(packet.ToArray(), 0, packet.Count);
            Console.WriteLine($"Command sent: {command}");
            Console.WriteLine($"Command packet details - Protocol: 0x80, CommandLength: {lengthOfCommand}, ServerFlag: {PacketHumanizer.ToHex(DefaultServerFlag)}, Language: English, Serial: {serial}");
            Console.WriteLine($"Command TX Raw: {PacketHumanizer.ToHex(packet.ToArray())}");
        }
    }
}

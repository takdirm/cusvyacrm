// Handlers/LocationHandler.cs
using System;
using Microsoft.Extensions.Logging;

namespace GprsServer.Handlers
{
    public class LocationHandler
    {
        private readonly ILogger<LocationHandler> _logger;

        public LocationHandler(ILogger<LocationHandler> logger)
        {
            _logger = logger;
        }

        public void Handle(ParsedPacket packet)
        {
            Console.WriteLine("Location packet received.");
            _logger.LogInformation("Location packet received.");

            if (packet.Content.Length < 26)
            {
                Console.WriteLine("Invalid location payload.");
                _logger.LogWarning("Invalid location payload. Length: {Length}", packet.Content.Length);
                return;
            }

            DateTime timestamp = DecodeDateTime(packet.Content, 0);
            double latitude = DecodeCoordinate(ReadUInt32(packet.Content, 7));
            double longitude = DecodeCoordinate(ReadUInt32(packet.Content, 11));
            byte speed = packet.Content[15];
            ushort courseStatus = ReadUInt16(packet.Content, 16);
            int course = courseStatus & 0x03FF;
            bool isWestLongitude = (courseStatus & (1 << 11)) != 0;
            bool isNorthLatitude = (courseStatus & (1 << 10)) != 0;

            if (!isNorthLatitude)
            {
                latitude = -latitude;
            }

            if (isWestLongitude)
            {
                longitude = -longitude;
            }

            ushort mcc = ReadUInt16(packet.Content, 18);
            byte mnc = packet.Content[20];
            ushort lac = ReadUInt16(packet.Content, 21);
            int cellId = ReadUInt24(packet.Content, 23);

            string gpsInfo = $"GPS - Time(UTC): {timestamp:yyyy-MM-dd HH:mm:ss}, Lat: {latitude:F6}, Lon: {longitude:F6}, Speed: {speed}km/h, Course: {course}°";
            Console.WriteLine(gpsInfo);
            _logger.LogInformation(gpsInfo);

            string courseDecoded = $"GPS Course/Status decoded - {PacketHumanizer.DescribeCourseStatus(courseStatus)}";
            Console.WriteLine(courseDecoded);
            _logger.LogDebug(courseDecoded);

            string lbsInfo = $"LBS - MCC: {mcc}, MNC: {mnc}, LAC: {lac}, CellId: {cellId}";
            Console.WriteLine(lbsInfo);
            _logger.LogDebug(lbsInfo);
        }

        internal static DateTime DecodeDateTime(byte[] data, int offset)
        {
            int year = 2000 + data[offset];
            int month = data[offset + 1];
            int day = data[offset + 2];
            int hour = data[offset + 3];
            int minute = data[offset + 4];
            int second = data[offset + 5];

            return new DateTime(year, month, day, hour, minute, second, DateTimeKind.Utc);
        }

        internal static ushort ReadUInt16(byte[] data, int offset) => (ushort)((data[offset] << 8) | data[offset + 1]);

        internal static uint ReadUInt32(byte[] data, int offset) =>
            ((uint)data[offset] << 24) |
            ((uint)data[offset + 1] << 16) |
            ((uint)data[offset + 2] << 8) |
            data[offset + 3];

        internal static int ReadUInt24(byte[] data, int offset) =>
            (data[offset] << 16) |
            (data[offset + 1] << 8) |
            data[offset + 2];

        internal static double DecodeCoordinate(uint rawValue) => rawValue / 30000d / 60d;
    }
}

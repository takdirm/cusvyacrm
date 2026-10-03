// Handlers/AlarmHandler.cs
using System;
using Microsoft.Extensions.Logging;

namespace GprsServer.Handlers
{
    public class AlarmHandler
    {
        private readonly ILogger<AlarmHandler> _logger;

        public AlarmHandler(ILogger<AlarmHandler> logger)
        {
            _logger = logger;
        }

        public void Handle(ParsedPacket packet)
        {
            Console.WriteLine("Alarm packet received.");
            _logger.LogWarning("Alarm packet received.");

            if (packet.Content.Length < 31)
            {
                Console.WriteLine("Invalid alarm payload.");
                _logger.LogWarning("Invalid alarm payload. Length: {Length}", packet.Content.Length);
                return;
            }

            DateTime timestamp = LocationHandler.DecodeDateTime(packet.Content, 0);
            double latitude = LocationHandler.DecodeCoordinate(LocationHandler.ReadUInt32(packet.Content, 7));
            double longitude = LocationHandler.DecodeCoordinate(LocationHandler.ReadUInt32(packet.Content, 11));
            byte speed = packet.Content[15];
            ushort courseStatus = LocationHandler.ReadUInt16(packet.Content, 16);
            byte lbsLength = packet.Content[18];
            ushort mcc = LocationHandler.ReadUInt16(packet.Content, 19);
            byte mnc = packet.Content[21];
            ushort lac = LocationHandler.ReadUInt16(packet.Content, 22);
            int cellId = LocationHandler.ReadUInt24(packet.Content, 24);
            byte terminalInfo = packet.Content[27];
            byte voltage = packet.Content[28];
            byte gsm = packet.Content[29];
            ushort alarmLanguage = LocationHandler.ReadUInt16(packet.Content, 30);
            int course = courseStatus & 0x03FF;

            string gpsInfo = $"Alarm GPS - Time(UTC): {timestamp:yyyy-MM-dd HH:mm:ss}, Lat: {latitude:F6}, Lon: {longitude:F6}, Speed: {speed}km/h, Course: {course}°";
            Console.WriteLine(gpsInfo);
            _logger.LogWarning(gpsInfo);

            string courseDecoded = $"Alarm GPS Course/Status decoded - {PacketHumanizer.DescribeCourseStatus(courseStatus)}";
            Console.WriteLine(courseDecoded);
            _logger.LogDebug(courseDecoded);

            string lbsInfo = $"Alarm LBS - LBSLength: {lbsLength}, MCC: {mcc}, MNC: {mnc}, LAC: {lac}, CellId: {cellId}";
            Console.WriteLine(lbsInfo);
            _logger.LogDebug(lbsInfo);

            string statusRaw = $"Alarm Status raw - TerminalInfo: 0x{terminalInfo:X2}, Voltage: {voltage}, GSM: {gsm}, Alarm/Language: 0x{alarmLanguage:X4}";
            Console.WriteLine(statusRaw);
            _logger.LogDebug(statusRaw);

            string statusDecoded = $"Alarm Status decoded - {PacketHumanizer.DescribeTerminalInfo(terminalInfo)}";
            Console.WriteLine(statusDecoded);
            _logger.LogDebug(statusDecoded);

            string voltageDecoded = $"Alarm Voltage decoded - {PacketHumanizer.DescribeVoltage(voltage)}";
            Console.WriteLine(voltageDecoded);
            _logger.LogDebug(voltageDecoded);

            string gsmDecoded = $"Alarm GSM decoded - {PacketHumanizer.DescribeGsmSignal(gsm)}";
            Console.WriteLine(gsmDecoded);
            _logger.LogDebug(gsmDecoded);

            string alarmDecoded = $"Alarm/Language decoded - {PacketHumanizer.DescribeAlarmLanguage(alarmLanguage)}";
            Console.WriteLine(alarmDecoded);
            _logger.LogDebug(alarmDecoded);
        }
    }
}

using System;

namespace GprsServer
{
    public static class PacketHumanizer
    {
        public static string ToHex(byte[] bytes) => BitConverter.ToString(bytes).Replace("-", string.Empty);

        public static string DecodeBcdImei(byte[] terminalIdBytes)
        {
            if (terminalIdBytes == null || terminalIdBytes.Length == 0)
            {
                return string.Empty;
            }

            var imei = new System.Text.StringBuilder(terminalIdBytes.Length * 2);
            foreach (byte value in terminalIdBytes)
            {
                imei.Append((value >> 4) & 0x0F);
                imei.Append(value & 0x0F);
            }

            return imei.ToString().TrimStart('0');
        }

        public static string DescribeTerminalInfo(byte terminalInfo)
        {
            string oilAndElectricity = (terminalInfo & 0x80) != 0 ? "Disconnected" : "Connected";
            string gpsTracking = (terminalInfo & 0x40) != 0 ? "On" : "Off";
            int alarmCode = (terminalInfo >> 3) & 0x07;
            string alarm = alarmCode switch
            {
                4 => "SOS",
                3 => "LowBatteryAlarm",
                2 => "PowerCutAlarm",
                1 => "ShockAlarm",
                _ => "Normal"
            };
            string charge = (terminalInfo & 0x04) != 0 ? "On" : "Off";
            string acc = (terminalInfo & 0x02) != 0 ? "High" : "Low";
            string activated = (terminalInfo & 0x01) != 0 ? "Activated" : "Deactivated";

            return $"Oil/Electricity: {oilAndElectricity}, GPS Tracking: {gpsTracking}, Alarm: {alarm}, Charge: {charge}, ACC: {acc}, Device: {activated}";
        }

        public static string DescribeVoltage(byte voltage) => voltage switch
        {
            0 => "NoPower",
            1 => "ExtremelyLow",
            2 => "VeryLow",
            3 => "Low",
            4 => "Medium",
            5 => "High",
            6 => "VeryHigh",
            _ => $"Unknown({voltage})"
        };

        public static string DescribeGsmSignal(byte gsm) => gsm switch
        {
            0 => "NoSignal",
            1 => "ExtremelyWeak",
            2 => "VeryWeak",
            3 => "Good",
            4 => "Strong",
            _ => $"Unknown({gsm})"
        };

        public static string DescribeAlarmLanguage(ushort alarmLanguage)
        {
            byte alarm = (byte)(alarmLanguage >> 8);
            byte language = (byte)(alarmLanguage & 0xFF);

            string alarmText = alarm switch
            {
                0x00 => "Normal",
                0x01 => "SOS",
                0x02 => "PowerCutAlarm",
                0x03 => "ShockAlarm",
                0x04 => "FenceInAlarm",
                0x05 => "FenceOutAlarm",
                0x0E => "FenceAlarm",
                0x19 => "LowBatteryAlarm",
                0x40 => "HighPowerVoltageAlarm",
                0x44 => "HarshAccelerateAlarm",
                0x45 => "HarshBrakingAlarm",
                0x46 => "HarshCurveAlarm",
                0x47 => "DeviceTurnOverAlarm",
                0xFE => "ACCOnAlarm",
                0xFF => "ACCOffAlarm",
                _ => $"UnknownAlarm({alarm:X2})"
            };

            return $"Alarm: {alarmText}, Language: {DescribeLanguage(language)}";
        }

        public static string DescribeLanguage(byte language) => language switch
        {
            0x01 => "Chinese",
            0x02 => "English",
            _ => $"UnknownLanguage({language:X2})"
        };

        public static string DescribeCourseStatus(ushort courseStatus)
        {
            int course = courseStatus & 0x03FF;
            string longitude = (courseStatus & (1 << 11)) != 0 ? "West" : "East";
            string latitude = (courseStatus & (1 << 10)) != 0 ? "North" : "South";
            string positioned = (courseStatus & (1 << 12)) != 0 ? "Positioned" : "NotPositioned";
            string gpsMode = (courseStatus & (1 << 13)) != 0 ? "Differential" : "Realtime";

            return $"Course: {course}°, Latitude: {latitude}, Longitude: {longitude}, GPS: {gpsMode}, Fix: {positioned}";
        }

        /// <summary>
        /// Describes M-series (GT06N) alarm codes.
        /// </summary>
        public static string DescribeMseriesAlarmCode(byte alarmCode) => alarmCode switch
        {
            0x01 => "SOS Alarm",
            0x02 => "Power Off Alarm",
            0x03 => "Vibration Alarm",
            0x06 => "Over Speed Alarm",
            0x19 => "Low Battery Alarm",
            0x0C => "Device Removing Alarm",
            0x40 => "High Power Voltage Alarm",
            0x44 => "Harsh Accelerate Alarm",
            0x45 => "Harsh Braking Alarm",
            0x46 => "Harsh Curve Alarm",
            0x47 => "Device Turn Over Alarm",
            0xFF => "ACC Off Alarm",
            0xFE => "ACC On Alarm",
            _ => $"UnknownAlarm(0x{alarmCode:X2})"
        };
    }
}


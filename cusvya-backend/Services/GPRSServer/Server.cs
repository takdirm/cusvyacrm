using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using GprsServer.Handlers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Scootr.Data.DTOs.GPRS;
using Scootr.Data.Repositories.Interfaces;
using Scootr.Data.Services.Gprs;

namespace GprsServer
{
    public class Server
    {
        private readonly int _port;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<Server> _logger;
        private readonly object _streamLock = new();
        private readonly Dictionary<string, NetworkStream> _streamByIdentifier = new(StringComparer.OrdinalIgnoreCase);
        private NetworkStream? _activeStream;
        private int _commandSerial = 1;

        public Server(int port, IServiceScopeFactory scopeFactory, ILogger<Server> logger, IConfiguration configuration)
        {
            _port = port;
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public bool SendEngineOff()
        {
            var stream = GetActiveStream();
            if (stream is null)
            {
                Console.WriteLine("No active terminal connection to send Engine OFF command.");
                _logger.LogWarning("No active terminal connection to send Engine OFF command.");
                return false;
            }

            CommandHandler.SendEngineStop(stream, GetNextCommandSerial());
            return true;
        }

        public bool SendEngineOn()
        {
            var stream = GetActiveStream();
            if (stream is null)
            {
                Console.WriteLine("No active terminal connection to send Engine ON command.");
                _logger.LogWarning("No active terminal connection to send Engine ON command.");
                return false;
            }

            CommandHandler.SendEngineResume(stream, GetNextCommandSerial());
            return true;
        }

        public bool SendEngineOff(string imeiOrClientId)
        {
            var stream = GetStreamByIdentifier(imeiOrClientId);
            if (stream is null)
            {
                Console.WriteLine($"No active terminal found for identifier '{imeiOrClientId}'.");
                _logger.LogWarning("No active terminal found for identifier '{ImeiOrClientId}'", imeiOrClientId);
                return false;
            }

            CommandHandler.SendEngineStop(stream, GetNextCommandSerial());
            return true;
        }

        public bool SendEngineOn(string imeiOrClientId)
        {
            var stream = GetStreamByIdentifier(imeiOrClientId);
            if (stream is null)
            {
                Console.WriteLine($"No active terminal found for identifier '{imeiOrClientId}'.");
                _logger.LogWarning("No active terminal found for identifier '{ImeiOrClientId}'", imeiOrClientId);
                return false;
            }

            CommandHandler.SendEngineResume(stream, GetNextCommandSerial());
            return true;
        }

        private NetworkStream? GetActiveStream()
        {
            lock (_streamLock)
            {
                return _activeStream;
            }
        }

        private NetworkStream? GetStreamByIdentifier(string identifier)
        {
            if (string.IsNullOrWhiteSpace(identifier))
            {
                return null;
            }

            lock (_streamLock)
            {
                return _streamByIdentifier.TryGetValue(identifier.Trim(), out var stream) ? stream : null;
            }
        }

        private ushort GetNextCommandSerial()
        {
            int next = Interlocked.Increment(ref _commandSerial);
            return (ushort)(next & 0xFFFF);
        }

        public void Start()
        {
            TcpListener listener = new TcpListener(IPAddress.Any, _port);
            listener.Start();
            Console.WriteLine($"Listening on port {_port}...");
            _logger.LogInformation("Server listening on port {Port}", _port);

            Task.Run(async () =>
            {
                while (true)
                {
                    try
                    {
                        var client = await listener.AcceptTcpClientAsync();
                        Console.WriteLine("Client connected.");
                        _logger.LogInformation("Client connected from {RemoteEndPoint}", client.Client.RemoteEndPoint);
                        _ = HandleClient(client);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error accepting client connection: {ex.Message}");
                        _logger.LogError(ex, "Error accepting client connection");
                    }
                }
            });
        }

        private async Task HandleClient(TcpClient client)
        {
            using (client)
            {
                var stream = client.GetStream();
                lock (_streamLock)
                {
                    _activeStream = stream;
                }

                byte[] buffer = new byte[4096];
                List<byte> receiveBuffer = [];
                string terminalId = "UNKNOWN";
                string imei = string.Empty;
                string clientId = client.Client.RemoteEndPoint?.ToString() ?? Guid.NewGuid().ToString("N");

                try
                {
                    while (true)
                    {
                        int bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length);
                        if (bytesRead == 0)
                        {
                            break;
                        }

                        byte[] chunk = new byte[bytesRead];
                        Array.Copy(buffer, chunk, bytesRead);
                        string chunkHex = PacketHumanizer.ToHex(chunk);
                        Console.WriteLine($"RX Raw Chunk ({bytesRead} bytes): {chunkHex}");
                        _logger.LogDebug("RX Raw Chunk ({BytesRead} bytes): {ChunkHex}", bytesRead, chunkHex);
                        receiveBuffer.AddRange(chunk);

                        while (TryExtractPacket(receiveBuffer, out byte[]? packet))
                        {
                            if (packet is null)
                            {
                                continue;
                            }

                            try
                            {
                                string packetHex = PacketHumanizer.ToHex(packet);
                                Console.WriteLine($"RX Raw Packet ({packet.Length} bytes): {packetHex}");
                                _logger.LogDebug("RX Raw Packet ({PacketLength} bytes): {PacketHex}", packet.Length, packetHex);

                                var parsed = PacketParser.Parse(packet);
                                if (parsed is null)
                                {
                                    continue;
                                }

                                if (parsed.Protocol == 0x01)
                                {
                                    imei = PacketHumanizer.DecodeBcdImei(parsed.Content);
                                    terminalId = string.IsNullOrWhiteSpace(imei) ? terminalId : imei;
                                }

                                RegisterIdentifiers(stream, clientId, terminalId, imei);

                                string parsedInfo = $"RX Parsed - Protocol: 0x{parsed.Protocol:X2}, Serial: {parsed.Serial}, ContentLength: {parsed.Content.Length}";
                                Console.WriteLine(parsedInfo);
                                _logger.LogDebug(parsedInfo);

                                try
                                {
                                    await PersistPacketAsync(parsed, packet, terminalId, imei);
                                }
                                catch (Exception persistEx)
                                {
                                    Console.WriteLine($"Failed to persist packet: {persistEx.Message}");
                                    _logger.LogError(persistEx, "Failed to persist packet for IMEI '{Imei}'", imei);
                                }

                                // Get handlers from DI container
                                using var handlerScope = _scopeFactory.CreateScope();
                                var serviceProvider = handlerScope.ServiceProvider;

                                try
                                {
                                    switch (parsed.Protocol)
                                    {
                                        case 0x01:
                                            serviceProvider.GetRequiredService<LoginHandler>().Handle(parsed, stream);
                                            break;
                                        case 0x12:
                                            serviceProvider.GetRequiredService<LocationHandler>().Handle(parsed);
                                            break;
                                        case 0x13:
                                            serviceProvider.GetRequiredService<HeartbeatHandler>().Handle(parsed, stream);
                                            break;
                                        case 0x15:
                                            serviceProvider.GetRequiredService<CommandReplyHandler>().Handle(parsed);
                                            break;
                                        case 0x21:
                                            serviceProvider.GetRequiredService<StringInformationHandler>().Handle(parsed);
                                            break;
                                        case 0x16:
                                        case 0x22:
                                        case 0x26:
                                            serviceProvider.GetRequiredService<AlarmHandler>().Handle(parsed);
                                            break;
                                        case 0x1A:
                                            Console.WriteLine("Address query packet (0x1A) received.");
                                            _logger.LogDebug("Address query packet (0x1A) received.");
                                            break;
                                        case 0x36:
                                            serviceProvider.GetRequiredService<ExtendedHeartbeatHandler>().Handle(parsed, stream);
                                            break;
                                        case 0x8A:
                                            Console.WriteLine("Time sync/extended packet (0x8A) received.");
                                            _logger.LogDebug("Time sync/extended packet (0x8A) received.");
                                            break;
                                        case 0x94:
                                            Console.WriteLine("Extended location packet (0x94) received. Location persistence skipped (format differs by device model). ");
                                            _logger.LogDebug("Extended location packet (0x94) received. Location persistence skipped (format differs by device model).");
                                            break;
                                        case 0x24:
                                            Console.WriteLine("LBS/extended status packet (0x24) received.");
                                            _logger.LogDebug("LBS/extended status packet (0x24) received.");
                                            break;
                                        case 0x28:
                                            Console.WriteLine("Waypoint/batch location packet (0x28) received - parsing vendor-specific format.");
                                            _logger.LogDebug("Waypoint/batch location packet (0x28) received - parsing vendor-specific format.");
                                            break;
                                        default:
                                            Console.WriteLine($"Unknown protocol {parsed.Protocol:X2}");
                                            _logger.LogWarning("Unknown protocol 0x{Protocol:X2}", parsed.Protocol);
                                            break;
                                    }
                                }
                                catch (Exception handlerEx)
                                {
                                    Console.WriteLine($"Handler error for protocol 0x{parsed.Protocol:X2}: {handlerEx.Message}");
                                    _logger.LogError(handlerEx, "Handler error for protocol 0x{Protocol:X2}", parsed.Protocol);
                                }
                            }
                            catch (Exception packetEx)
                            {
                                Console.WriteLine($"Error processing packet: {packetEx.Message}");
                                _logger.LogError(packetEx, "Error processing packet");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Client connection error: {ex.Message}");
                    _logger.LogError(ex, "Client connection error");
                }
                finally
                {
                    lock (_streamLock)
                    {
                        if (ReferenceEquals(_activeStream, stream))
                        {
                            _activeStream = null;
                        }
                    }

                    UnregisterStream(stream);
                    Console.WriteLine("Client disconnected.");
                    _logger.LogInformation("Client disconnected");
                }
            }
        }

        private async Task PersistPacketAsync(ParsedPacket parsed, byte[] packet, string terminalId, string imei)
        {
            try
            {
                int? scooterId = await ResolveScooterIdByImeiAsync(imei);

                var dto = new GprsPacketUpsertDto
                {
                    TerminalId = terminalId,
                    VehicleId = scooterId,
                    Imei = imei,
                    Protocol = parsed.Protocol,
                    InfoType = IsAlarmProtocol(parsed.Protocol) ? "Alarm" : "Normal",
                    Summary = $"Protocol=0x{parsed.Protocol:X2}, Serial={parsed.Serial}, ContentLength={parsed.Content.Length}",
                    RawHex = PacketHumanizer.ToHex(packet),
                    Serial = parsed.Serial,
                    ReceivedAtUtc = DateTime.UtcNow
                };

                if (TryExtractCoordinates(parsed, out decimal? latitude, out decimal? longitude))
                {
                    dto.Latitude = latitude;
                    dto.Longitude = longitude;
                }

                using var scope = _scopeFactory.CreateScope();
                var gprsService = scope.ServiceProvider.GetRequiredService<IGprsService>();
                await gprsService.TrackPacketAsync(dto);

                if (TryBuildHeartbeatUpsert(parsed, packet, terminalId, imei, out var heartbeatDto))
                {
                    heartbeatDto.VehicleId = scooterId;
                    await gprsService.TrackHeartbeatAsync(heartbeatDto);
                }

                if (TryBuildLocationUpsert(parsed, packet, terminalId, imei, out var locationDto))
                {
                    locationDto.VehicleId = scooterId;

                    if (parsed.Protocol == 0x24 && locationDto.Latitude == 0m && locationDto.Longitude == 0m)
                    {
                        var previousLocation = await gprsService.GetLocationCurrentByTerminalIdAsync(terminalId);
                        if (previousLocation != null)
                        {
                            locationDto.Latitude = previousLocation.Latitude;
                            locationDto.Longitude = previousLocation.Longitude;
                        }
                    }

                    await gprsService.TrackLocationAsync(locationDto);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GPRS DB persist failed: {ex.Message}");
                _logger.LogError(ex, "GPRS DB persist failed");
            }
        }

        private async Task<int?> ResolveScooterIdByImeiAsync(string imei)
        {
            if (string.IsNullOrWhiteSpace(imei))
            {
                return null;
            }

            string trimmedImei = imei.Trim();

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                var tracker = await unitOfWork.TrackerDevices.FirstOrDefaultAsync(t => t.IMEI == trimmedImei && t.VehicleId.HasValue);
                return tracker?.VehicleId;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Tracker lookup failed for IMEI '{trimmedImei}': {ex.Message}");
                _logger.LogWarning(ex, "Tracker lookup failed for IMEI '{TrimmedImei}'", trimmedImei);
                return null;
            }
        }

        private void RegisterIdentifiers(NetworkStream stream, params string[] identifiers)
        {
            lock (_streamLock)
            {
                foreach (var identifier in identifiers)
                {
                    if (!string.IsNullOrWhiteSpace(identifier))
                    {
                        _streamByIdentifier[identifier.Trim()] = stream;
                    }
                }
            }
        }

        private void UnregisterStream(NetworkStream stream)
        {
            lock (_streamLock)
            {
                var keys = new List<string>();
                foreach (var entry in _streamByIdentifier)
                {
                    if (ReferenceEquals(entry.Value, stream))
                    {
                        keys.Add(entry.Key);
                    }
                }

                foreach (var key in keys)
                {
                    _streamByIdentifier.Remove(key);
                }
            }
        }

        private static bool IsAlarmProtocol(byte protocol) => protocol == 0x16 || protocol == 0x22 || protocol == 0x26;

        private static bool IsLocationLikeProtocol(byte protocol)
            => protocol == 0x12 || protocol == 0x16 || protocol == 0x22 || protocol == 0x24 || protocol == 0x26 || protocol == 0x28;

        private static bool TryExtractCoordinates(ParsedPacket parsed, out decimal? latitude, out decimal? longitude)
        {
            latitude = null;
            longitude = null;

            if (!TryExtractLocationFields(parsed, out _, out var lat, out var lon, out _, out _, out _, out _, out _, out _))
            {
                return false;
            }

            latitude = lat;
            longitude = lon;
            return true;
        }

        private static bool TryBuildHeartbeatUpsert(ParsedPacket parsed, byte[] packet, string terminalId, string imei, out GprsHeartbeatUpsertDto dto)
        {
            dto = new GprsHeartbeatUpsertDto();
            if (parsed.Protocol != 0x13 || parsed.Content.Length < 5)
            {
                return false;
            }

            byte terminalInfo = parsed.Content[0];
            byte voltage = parsed.Content[1];
            byte gsm = parsed.Content[2];
            ushort alarmLanguage = LocationHandler.ReadUInt16(parsed.Content, 3);

            dto = new GprsHeartbeatUpsertDto
            {
                TerminalId = terminalId,
                Imei = imei,
                Protocol = parsed.Protocol,
                Serial = parsed.Serial,
                OilElectricityStatus = (terminalInfo & 0x80) != 0 ? "Disconnected" : "Connected",
                GpsTrackingStatus = (terminalInfo & 0x40) != 0 ? "On" : "Off",
                AlarmStatus = ((terminalInfo >> 3) & 0x07) switch
                {
                    4 => "SOS",
                    3 => "LowBatteryAlarm",
                    2 => "PowerCutAlarm",
                    1 => "ShockAlarm",
                    _ => "Normal"
                },
                ChargeStatus = (terminalInfo & 0x04) != 0 ? "On" : "Off",
                AccStatus = (terminalInfo & 0x02) != 0 ? "High" : "Low",
                DeviceStatus = (terminalInfo & 0x01) != 0 ? "Activated" : "Deactivated",
                VoltageLevel = PacketHumanizer.DescribeVoltage(voltage),
                GsmSignalLevel = PacketHumanizer.DescribeGsmSignal(gsm),
                AlarmLanguage = PacketHumanizer.DescribeAlarmLanguage(alarmLanguage),
                RawHex = PacketHumanizer.ToHex(packet),
                ReceivedAtUtc = DateTime.UtcNow
            };

            return true;
        }

        private static bool TryBuildLocationUpsert(ParsedPacket parsed, byte[] packet, string terminalId, string imei, out GprsLocationUpsertDto dto)
        {
            dto = new GprsLocationUpsertDto();
            if (!TryExtractLocationFields(parsed, out var locationTimeUtc, out var latitude, out var longitude, out var speedKmh, out var course, out var mcc, out var mnc, out var lac, out var cellId))
            {
                return false;
            }

            dto = new GprsLocationUpsertDto
            {
                TerminalId = terminalId,
                Imei = imei,
                Protocol = parsed.Protocol,
                Serial = parsed.Serial,
                Latitude = latitude,
                Longitude = longitude,
                SpeedKmh = speedKmh,
                Course = course,
                Mcc = mcc,
                Mnc = mnc,
                Lac = lac,
                CellId = cellId,
                RawHex = PacketHumanizer.ToHex(packet),
                LocationTimeUtc = locationTimeUtc,
                ReceivedAtUtc = DateTime.UtcNow
            };

            return true;
        }

        private static bool TryExtractLocationFields(ParsedPacket parsed, out DateTime locationTimeUtc, out decimal latitude, out decimal longitude, out int speedKmh, out int course, out ushort mcc, out byte mnc, out ushort lac, out int cellId)
        {
            locationTimeUtc = DateTime.UtcNow;
            latitude = 0m;
            longitude = 0m;
            speedKmh = 0;
            course = 0;
            mcc = 0;
            mnc = 0;
            lac = 0;
            cellId = 0;

            if (!IsLocationLikeProtocol(parsed.Protocol))
            {
                return false;
            }

            if (parsed.Protocol == 0x24)
            {
                return TryExtractProtocol24LocationFields(parsed.Content, out locationTimeUtc, out latitude, out longitude, out speedKmh, out course, out mcc, out mnc, out lac, out cellId);
            }

            if (parsed.Protocol == 0x28)
            {
                return TryExtractProtocol28LocationFields(parsed.Content, out locationTimeUtc, out latitude, out longitude, out speedKmh, out course, out mcc, out mnc, out lac, out cellId);
            }

            if (parsed.Content.Length < 26)
            {
                return false;
            }

            if (!TryDecodeLocationTime(parsed.Content, 0, out locationTimeUtc))
            {
                locationTimeUtc = DateTime.UtcNow;
            }

            double lat = LocationHandler.DecodeCoordinate(LocationHandler.ReadUInt32(parsed.Content, 7));
            double lon = LocationHandler.DecodeCoordinate(LocationHandler.ReadUInt32(parsed.Content, 11));
            speedKmh = parsed.Content[15];
            ushort courseStatus = LocationHandler.ReadUInt16(parsed.Content, 16);
            course = courseStatus & 0x03FF;

            bool isWestLongitude = (courseStatus & (1 << 11)) != 0;
            bool isNorthLatitude = (courseStatus & (1 << 10)) != 0;
            if (!isNorthLatitude)
            {
                lat = -lat;
            }

            if (isWestLongitude)
            {
                lon = -lon;
            }

            int lbsOffset = parsed.Protocol == 0x12 || parsed.Protocol == 0x94 ? 18 : 19;
            if (parsed.Content.Length < lbsOffset + 8)
            {
                return false;
            }

            mcc = LocationHandler.ReadUInt16(parsed.Content, lbsOffset);
            mnc = parsed.Content[lbsOffset + 2];
            lac = LocationHandler.ReadUInt16(parsed.Content, lbsOffset + 3);
            cellId = LocationHandler.ReadUInt24(parsed.Content, lbsOffset + 5);
            latitude = Convert.ToDecimal(lat);
            longitude = Convert.ToDecimal(lon);
            return true;
        }

        private static bool TryExtractProtocol24LocationFields(byte[] content, out DateTime locationTimeUtc, out decimal latitude, out decimal longitude, out int speedKmh, out int course, out ushort mcc, out byte mnc, out ushort lac, out int cellId)
        {
            locationTimeUtc = DateTime.UtcNow;
            latitude = 0m;
            longitude = 0m;
            speedKmh = 0;
            course = 0;
            mcc = 0;
            mnc = 0;
            lac = 0;
            cellId = 0;

            if (content.Length < 6)
            {
                return false;
            }

            if (!TryDecodeLocationTime(content, 0, out locationTimeUtc))
            {
                locationTimeUtc = DateTime.UtcNow;
            }

            int[] gpsOffsetCandidates = { 7, 8, 9, 10 };
            foreach (int gpsOffset in gpsOffsetCandidates)
            {
                if (content.Length < gpsOffset + 11)
                {
                    continue;
                }

                double lat = LocationHandler.DecodeCoordinate(LocationHandler.ReadUInt32(content, gpsOffset));
                double lon = LocationHandler.DecodeCoordinate(LocationHandler.ReadUInt32(content, gpsOffset + 4));
                int speed = content[gpsOffset + 8];
                ushort courseStatus = LocationHandler.ReadUInt16(content, gpsOffset + 9);

                bool isWestLongitude = (courseStatus & (1 << 11)) != 0;
                bool isNorthLatitude = (courseStatus & (1 << 10)) != 0;
                if (!isNorthLatitude)
                {
                    lat = -lat;
                }

                if (isWestLongitude)
                {
                    lon = -lon;
                }

                if (!IsCoordinateInRange(lat, lon) || speed > 200)
                {
                    continue;
                }

                latitude = Convert.ToDecimal(lat);
                longitude = Convert.ToDecimal(lon);
                speedKmh = speed;
                course = courseStatus & 0x03FF;

                int lbsOffset = gpsOffset + 11;
                if (content.Length >= lbsOffset + 8)
                {
                    mcc = LocationHandler.ReadUInt16(content, lbsOffset);
                    mnc = content[lbsOffset + 2];
                    lac = LocationHandler.ReadUInt16(content, lbsOffset + 3);
                    cellId = LocationHandler.ReadUInt24(content, lbsOffset + 5);
                }
                else
                {
                    TryExtractLbsByHeuristic(content, out mcc, out mnc, out lac, out cellId);
                }

                return true;
            }

            TryExtractLbsByHeuristic(content, out mcc, out mnc, out lac, out cellId);
            return true;
        }

        private static bool TryExtractLbsByHeuristic(byte[] content, out ushort mcc, out byte mnc, out ushort lac, out int cellId)
        {
            mcc = 0;
            mnc = 0;
            lac = 0;
            cellId = 0;

            for (int i = 0; i <= content.Length - 8; i++)
            {
                ushort candidateMcc = LocationHandler.ReadUInt16(content, i);
                byte candidateMnc = content[i + 2];
                ushort candidateLac = LocationHandler.ReadUInt16(content, i + 3);
                int candidateCellId = LocationHandler.ReadUInt24(content, i + 5);

                if (candidateMcc is >= 1 and <= 999 && candidateMnc <= 99 && candidateLac > 0)
                {
                    mcc = candidateMcc;
                    mnc = candidateMnc;
                    lac = candidateLac;
                    cellId = candidateCellId;
                    return true;
                }
            }

            return false;
        }

        private static bool TryExtractProtocol28LocationFields(byte[] content, out DateTime locationTimeUtc, out decimal latitude, out decimal longitude, out int speedKmh, out int course, out ushort mcc, out byte mnc, out ushort lac, out int cellId)
        {
            // Protocol 0x28: Waypoint/batch location packet
            // Structure:
            // Offset 0-5: Timestamp (YYMMDDhhmmss)
            // Offset 6-9: Latitude (4 bytes)
            // Offset 10-13: Longitude (4 bytes)
            // Offset 14-15: Speed (2 bytes, km/h)
            // Offset 16-17: Course/heading (2 bytes)
            // Offset 18+: Status/reserved fields, LBS info, etc.

            locationTimeUtc = DateTime.UtcNow;
            latitude = 0m;
            longitude = 0m;
            speedKmh = 0;
            course = 0;
            mcc = 0;
            mnc = 0;
            lac = 0;
            cellId = 0;

            if (content.Length < 18)
            {
                return false;
            }

            // Decode timestamp (6 bytes: YYMMDDhhmmss)
            if (!TryDecodeLocationTime(content, 0, out locationTimeUtc))
            {
                locationTimeUtc = DateTime.UtcNow;
            }

            // Extract latitude and longitude
            double lat = LocationHandler.DecodeCoordinate(LocationHandler.ReadUInt32(content, 6));
            double lon = LocationHandler.DecodeCoordinate(LocationHandler.ReadUInt32(content, 10));

            // Extract speed (2 bytes at offset 14, big-endian or little-endian)
            speedKmh = LocationHandler.ReadUInt16(content, 14);

            // Extract course/heading (2 bytes at offset 16)
            ushort courseStatus = LocationHandler.ReadUInt16(content, 16);
            course = courseStatus & 0x03FF;

            // Apply latitude/longitude direction flags if present
            bool isWestLongitude = (courseStatus & (1 << 11)) != 0;
            bool isNorthLatitude = (courseStatus & (1 << 10)) != 0;
            if (!isNorthLatitude)
            {
                lat = -lat;
            }

            if (isWestLongitude)
            {
                lon = -lon;
            }

            // Validate coordinates
            if (!IsCoordinateInRange(lat, lon) || speedKmh > 300)
            {
                string invalidMsg = $"Protocol 0x28: Invalid coordinates (lat={lat}, lon={lon}, speed={speedKmh}) - skipping persistence.";
                Console.WriteLine(invalidMsg);
                // Note: Cannot log from static method - logging happens at caller level
                return false;
            }

            latitude = Convert.ToDecimal(lat);
            longitude = Convert.ToDecimal(lon);

            // Try to extract LBS info if available
            if (content.Length >= 36)
            {
                // LBS info typically at offset 28+ (FF 00 02 00 + MCC/MNC/LAC/CellID pattern)
                TryExtractLbsByHeuristic(content, out mcc, out mnc, out lac, out cellId);
            }

            string protocol28Info = $"Protocol 0x28 parsed - Time: {locationTimeUtc:yyyy-MM-dd HH:mm:ss}, Lat: {latitude}, Lon: {longitude}, Speed: {speedKmh} km/h, Course: {course}°";
            Console.WriteLine(protocol28Info);
            // Note: Cannot log from static method - logging happens at caller level
            return true;
        }

        private static bool TryDecodeLocationTime(byte[] content, int offset, out DateTime locationTimeUtc)
        {
            locationTimeUtc = DateTime.UtcNow;

            if (content == null || content.Length < offset + 6)
            {
                return false;
            }

            try
            {
                locationTimeUtc = LocationHandler.DecodeDateTime(content, offset);
                return true;
            }
            catch
            {
                return false;
            }
        }

        private static bool IsCoordinateInRange(double lat, double lon)
            => lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

        private static bool TryExtractPacket(List<byte> buffer, out byte[]? packet)
        {
            packet = null;

            while (buffer.Count >= 2)
            {
                bool isShortHeader = buffer[0] == 0x78 && buffer[1] == 0x78;
                bool isLongHeader = buffer[0] == 0x79 && buffer[1] == 0x79;

                if (!isShortHeader && !isLongHeader)
                {
                    buffer.RemoveAt(0);
                    continue;
                }

                int lengthFieldBytes = isShortHeader ? 1 : 2;
                int minBytes = 2 + lengthFieldBytes + 1 + 2 + 2;
                if (buffer.Count < minBytes)
                {
                    return false;
                }

                int length = isShortHeader
                    ? buffer[2]
                    : (buffer[2] << 8) | buffer[3];

                int totalLength = isShortHeader
                    ? length + 5
                    : length + 6;

                if (buffer.Count < totalLength)
                {
                    return false;
                }

                if (buffer[totalLength - 2] != 0x0D || buffer[totalLength - 1] != 0x0A)
                {
                    buffer.RemoveAt(0);
                    continue;
                }

                packet = buffer.GetRange(0, totalLength).ToArray();
                buffer.RemoveRange(0, totalLength);
                return true;
            }

            return false;
        }
    }
}

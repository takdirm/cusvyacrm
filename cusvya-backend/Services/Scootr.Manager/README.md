# Scootr.Manager - Cross-Platform Background Worker Service

A .NET 8 background worker service that runs scheduled jobs on both Windows and Linux platforms.

## ✅ Features

- ✅ Cross-platform support (Windows Service / Linux systemd)
- ✅ Runs every 20 seconds (configurable)
- ✅ Built-in logging to both console and files
- ✅ Automatic log rotation (daily, keeps 30 days)
- ✅ Robust exception handling - service continues running even on errors
- ✅ Template for API integration and scheduled jobs
- ✅ Docker support
- ✅ Immediate console output for debugging

## 🚀 Quick Start

### Development Mode (Console)

```bash
cd Services/Scootr.Manager
dotnet run
```

You should see:
```
=========================================
Starting Scootr Manager Service...
=========================================
[21:26:36 INF] ======================================
[21:26:36 INF] Scootr Worker Service is STARTING
[21:26:36 INF] ======================================
[21:26:36 INF] Hello Scootr - Execution #1 at: 2026-08-06 21:26:36
[21:26:56 INF] Hello Scootr - Execution #2 at: 2026-08-06 21:26:56
```

### Log Files

Log files are automatically created in the `logs` directory:
- Location: `Services/Scootr.Manager/bin/Debug/net8.0/logs/`
- Format: `scootr-manager-YYYYMMDD.log`
- Rotation: Daily
- Retention: 30 days

Example log entry:
```
[2026-08-06 21:26:36.735 +05:30] [INF] Hello Scootr - Execution #1 at: 2026-08-06 21:26:36
```

### Windows Service

1. **Publish the application:**
   ```powershell
   dotnet publish -c Release -r win-x64 --self-contained
   ```

2. **Install as Windows Service:**
   ```powershell
   sc.exe create ScootrManager binPath="C:\Path\To\Scootr.Manager.exe"
   sc.exe start ScootrManager
   ```

3. **Manage the service:**
   ```powershell
   sc.exe stop ScootrManager
   sc.exe delete ScootrManager
   ```

### Linux systemd Service

1. **Publish the application:**
   ```bash
   dotnet publish -c Release -r linux-x64 --self-contained
   ```

2. **Create systemd service file** (`/etc/systemd/system/scootr-manager.service`):
   ```ini
   [Unit]
   Description=Scootr Manager Background Service
   After=network.target

   [Service]
   Type=notify
   ExecStart=/opt/scootr/Scootr.Manager
   Restart=always
   RestartSec=10
   KillSignal=SIGINT
   SyslogIdentifier=scootr-manager
   User=www-data
   Environment=ASPNETCORE_ENVIRONMENT=Production
   Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable and start the service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable scootr-manager
   sudo systemctl start scootr-manager
   sudo systemctl status scootr-manager
   ```

4. **View logs:**
   ```bash
   sudo journalctl -u scootr-manager -f
   ```

### Docker

```bash
docker build -t scootr-manager -f Services/Scootr.Manager/Dockerfile .
docker run -d --name scootr-manager scootr-manager
docker logs -f scootr-manager
```

## 🛡️ Exception Handling

The service is designed to be resilient and **will NOT shutdown on exceptions**:

- All exceptions in job execution are caught and logged
- Service continues running after errors
- Error count is tracked and logged
- Errors are written to both console and log files

Example error handling:
```
[21:27:16 ERR] ERROR in DoWorkAsync (Execution #3, Failure #1): Test exception
System.Exception: Test exception - intentional error for testing
   at Scootr.Manager.ScootrWorker.DoWorkAsync(...)
```

After an error, the service continues:
```
[21:27:36 INF] Hello Scootr - Execution #4 at: 2026-08-06 21:27:36
```

## 📝 Configuration

Edit `appsettings.json` or `conf/appsettings.json`:

```json
{
  "Logging": {
	"LogLevel": {
	  "Default": "Information"
	}
  },
  "ScootrWorker": {
	"PollingIntervalSeconds": 20,
	"Enabled": true
  },
  "ScootrApi": {
	"BaseUrl": "http://localhost:5000"
  }
}
```

## Adding Custom Jobs

1. Implement your job logic in `ScootrJobService.cs`
2. Call APIs, process data, or perform scheduled tasks
3. Use dependency injection to add required services

Example:
```csharp
public class ScootrJobService : IScootrJobService
{
	public async Task ExecuteAsync(CancellationToken cancellationToken)
	{
		// Your job logic here
		await CallNightlyApiAsync();
	}
}
```

## Architecture

- **Scootr.Manager**: Main worker service application
- **Scootr.Manager.Service**: Shared service library for job logic
- **ScootrWorker**: Background service that runs every 20 seconds
- **PeriodicTimer**: Modern .NET timer for scheduled execution

## Monitoring

- Windows: Event Viewer → Windows Logs → Application
- Linux: `journalctl -u scootr-manager`
- Console logs during development

## Troubleshooting

### Service won't start
- Check logs for errors
- Verify file permissions (Linux)
- Ensure all dependencies are published
- Check appsettings.json path

### High CPU usage
- Adjust polling interval in configuration
- Review job execution time
- Add delays if needed

### Jobs not executing
- Check `Enabled` flag in configuration
- Verify cancellation token handling
- Review logs for exceptions

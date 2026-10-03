# Scootr.Manager - Deployment & Operations Guide

## ✅ Verification Steps

After deployment, verify the service is working correctly:

### 1. Check Service Status

**Windows:**
```powershell
Get-Service ScootrManager
sc.exe query ScootrManager
```

**Linux:**
```bash
sudo systemctl status scootr-manager
```

### 2. View Real-time Logs

**Windows Event Viewer:**
- Open Event Viewer
- Navigate to: Windows Logs → Application
- Filter by Source: ScootrManager

**Linux journalctl:**
```bash
sudo journalctl -u scootr-manager -f
```

**Log Files (Both platforms):**
```bash
# Navigate to installation directory
cd /opt/scootr  # Linux
cd C:\Program Files\Scootr  # Windows

# View today's log
cat logs/scootr-manager-$(date +%Y%m%d).log  # Linux
type logs\scootr-manager-$(Get-Date -Format 'yyyyMMdd').log  # Windows

# Tail the log in real-time
tail -f logs/scootr-manager-*.log  # Linux
Get-Content logs\scootr-manager-*.log -Wait  # Windows
```

### 3. Verify "Hello Scootr" Messages

You should see entries every 20 seconds:
```
[2026-08-06 21:26:36.735 +05:30] [INF] Hello Scootr - Execution #1 at: 2026-08-06 21:26:36
[2026-08-06 21:26:56.749 +05:30] [INF] Hello Scootr - Execution #2 at: 2026-08-06 21:26:56
[2026-08-06 21:27:16.742 +05:30] [INF] Hello Scootr - Execution #3 at: 2026-08-06 21:27:16
```

## 🔧 Troubleshooting

### Service Won't Start

**Check permissions:**
```bash
# Linux
sudo chown -R www-data:www-data /opt/scootr
sudo chmod +x /opt/scootr/Scootr.Manager

# Windows
icacls "C:\Program Files\Scootr" /grant "NT AUTHORITY\SYSTEM:(OI)(CI)F"
```

**Check dependencies:**
```bash
# Verify .NET runtime is installed
dotnet --list-runtimes

# Should show: Microsoft.NETCore.App 8.0.x
```

**Check logs directory:**
```bash
# Create logs directory if missing
mkdir -p logs  # Linux
New-Item -ItemType Directory -Path logs -Force  # Windows
```

### No "Hello Scootr" Messages

**Verify configuration:**
```json
{
  "ScootrWorker": {
	"PollingIntervalSeconds": 20,
	"Enabled": true  // Must be true
  }
}
```

**Check if service is actually running:**
```bash
# Linux - should show "active (running)"
sudo systemctl status scootr-manager

# Windows - should show "RUNNING"
sc.exe query ScootrManager
```

**Increase logging level (appsettings.json):**
```json
{
  "Logging": {
	"LogLevel": {
	  "Default": "Debug",  // Changed from Information
	  "Scootr.Manager": "Debug"
	}
  }
}
```

### Service Crashes on Errors

This **should not happen** - the service is designed to handle exceptions gracefully.

If the service crashes:
1. Check the log file for the error
2. Look for errors in ExecuteAsync (these are fatal)
3. Errors in DoWorkAsync should be caught and logged without crashing

**To test exception handling:**
See `EXCEPTION-TEST.md` for testing procedures.

### Log Files Not Created

**Check directory permissions:**
```bash
# Linux
sudo chown -R www-data:www-data /opt/scootr/logs
sudo chmod 755 /opt/scootr/logs

# Windows (Run as Administrator)
icacls "C:\Program Files\Scootr\logs" /grant "NT AUTHORITY\SYSTEM:(OI)(CI)F"
```

**Verify log path in Program.cs:**
```csharp
var logPath = Path.Combine(AppContext.BaseDirectory, "logs");
Directory.CreateDirectory(logPath);  // This should create the directory
```

### High CPU Usage

**Adjust polling interval:**
```json
{
  "ScootrWorker": {
	"PollingIntervalSeconds": 60  // Increase from 20 to 60 seconds
  }
}
```

**Check for long-running jobs:**
- Review your job logic in DoWorkAsync
- Add timeouts to HTTP calls
- Use async/await properly

### Service Uses Too Much Disk Space

**Log files are rotated automatically:**
- Daily rotation
- Keeps last 30 days
- Older files are automatically deleted

**Manual cleanup if needed:**
```bash
# Linux
find /opt/scootr/logs -name "scootr-manager-*.log" -mtime +30 -delete

# Windows
Get-ChildItem C:\Program Files\Scootr\logs -Filter "scootr-manager-*.log" | 
  Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | 
  Remove-Item
```

## 📊 Monitoring

### Key Metrics to Monitor

1. **Service Status** - Should always be "Running"
2. **Execution Count** - Should increment every 20 seconds
3. **Failure Count** - Should be 0 or very low
4. **Log File Size** - Should be reasonable (< 100MB per day)

### Health Check Endpoint (Future)

To add a health check endpoint for monitoring:

```csharp
// In Program.cs, ConfigureServices:
services.AddHealthChecks();

// In Configure:
app.UseHealthChecks("/health");
```

Then monitor: `http://localhost:5000/health`

## 🔐 Security Best Practices

1. **Run as dedicated user (Linux):**
   ```bash
   sudo useradd -r -s /bin/false scootr
   sudo chown -R scootr:scootr /opt/scootr
   ```

2. **Restrict file permissions:**
   ```bash
   chmod 750 /opt/scootr
   chmod 640 /opt/scootr/appsettings.json
   chmod 750 /opt/scootr/logs
   ```

3. **Use secrets management:**
   - Store API keys in Azure Key Vault
   - Use User Secrets in development
   - Never commit secrets to source control

4. **Enable HTTPS for API calls:**
   ```csharp
   var handler = new HttpClientHandler
   {
	   ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
   };
   // Use only in development!
   ```

## 📈 Performance Optimization

### Reduce Memory Usage

```csharp
// In DoWorkAsync, dispose of resources properly:
using var httpClient = new HttpClient();
// ... use the client
```

### Batch Operations

Instead of calling API for each item, batch them:
```csharp
var items = await GetPendingItems();
var batches = items.Chunk(100);  // Process 100 items at a time

foreach (var batch in batches)
{
	await ProcessBatchAsync(batch, cancellationToken);
}
```

### Add Circuit Breaker

For resilient API calls:
```bash
dotnet add package Polly
```

```csharp
var policy = Policy
	.Handle<HttpRequestException>()
	.CircuitBreakerAsync(3, TimeSpan.FromMinutes(1));

await policy.ExecuteAsync(async () => 
{
	await CallApiAsync();
});
```

## 🔄 Updating the Service

### Windows

```powershell
# Stop the service
sc.exe stop ScootrManager

# Replace binaries
Copy-Item .\publish\* "C:\Program Files\Scootr" -Force -Recurse

# Start the service
sc.exe start ScootrManager
```

### Linux

```bash
# Stop the service
sudo systemctl stop scootr-manager

# Replace binaries
sudo cp -r ./publish/* /opt/scootr/

# Start the service
sudo systemctl start scootr-manager
```

## 🧪 Testing in Production

### Smoke Test After Deployment

```bash
# 1. Start the service
# 2. Wait 60 seconds
# 3. Check for at least 3 "Hello Scootr" messages

# Linux
sudo journalctl -u scootr-manager --since "1 minute ago" | grep "Hello Scootr" | wc -l
# Should output: 3 or more

# Windows
(Get-WinEvent -FilterHashtable @{LogName='Application'; ProviderName='ScootrManager'} -MaxEvents 100 | 
  Where-Object {$_.Message -like "*Hello Scootr*"}).Count
# Should output: 3 or more
```

### Load Testing

Monitor service under load:
```bash
# Reduce polling interval for stress test
# Set PollingIntervalSeconds to 1

# Monitor CPU and memory
top -p $(pgrep -f Scootr.Manager)  # Linux
```

## 📞 Support

If issues persist:

1. Collect the following information:
   - OS and version
   - .NET runtime version
   - Last 100 lines of log file
   - Service status output
   - Error messages

2. Check GitHub issues: https://github.com/takdirm/Scootr/issues

3. Create a new issue with the collected information

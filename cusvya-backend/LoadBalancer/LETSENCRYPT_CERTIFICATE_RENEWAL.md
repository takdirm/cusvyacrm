# Let's Encrypt Certificate Renewal Documentation
## FSB Load Balancer - Ubuntu Server Setup

---

## Table of Contents
1. [Overview](#overview)
2. [Initial Certificate Setup](#initial-certificate-setup)
3. [Docker Compose Configuration](#docker-compose-configuration)
4. [Automatic Renewal Setup](#automatic-renewal-setup)
5. [Testing & Verification](#testing--verification)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance Commands](#maintenance-commands)

---

## Overview

**Server**: Ubuntu Server  
**Container**: fsb.loadbalancer  
**Domains**:
- scootr.in
- api.scootr.in
- admin.scootr.in
- snehajadhav.com
- www.snehajadhav.com

**Certificate Location**: `/etc/letsencrypt/live/www.scootr.in/`  
**Renewal Schedule**: Twice daily (3:30 AM and 3:30 PM) via systemd timer  
**Auto-renewal**: Certificates renew 30 days before expiry

---

## Initial Certificate Setup

### Prerequisites

1. Ensure DNS A records point to your server's public IP:
```bash
# Verify DNS resolution
nslookup scootr.in
nslookup api.scootr.in
nslookup admin.scootr.in
nslookup snehajadhav.com
nslookup www.snehajadhav.com
```

2. Open firewall ports:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
sudo ufw status
```

### Install Certbot

```bash
# Update system
sudo apt update
sudo apt install -y snapd

# Install certbot via snap
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### Obtain Certificate

**Option 1: Multi-domain certificate (all domains in one cert)**

```bash
# Stop load balancer to free port 80
docker stop fsb.loadbalancer

# Request certificate for all domains
sudo certbot certonly --standalone \
  -d scootr.in -d api.scootr.in -d admin.scootr.in \
  -d snehajadhav.com -d www.snehajadhav.com \
  --email youremail@example.com --agree-tos --no-eff-email

# Verify certificate files
sudo ls -la /etc/letsencrypt/live/scootr.in/
```

**Option 2: Wildcard certificate (requires DNS challenge)**

```bash
# For Cloudflare DNS (example)
sudo snap install certbot-dns-cloudflare

# Create credentials file
sudo mkdir -p /root/.secrets/certbot
sudo nano /root/.secrets/certbot/cloudflare.ini
# Add: dns_cloudflare_api_token = your_api_token_here
sudo chmod 600 /root/.secrets/certbot/cloudflare.ini

# Request wildcard + apex domain
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /root/.secrets/certbot/cloudflare.ini \
  -d scootr.in -d '*.scootr.in' \
  --email youremail@example.com --agree-tos --non-interactive
```

### Fix Permissions

```bash
# Make certificate directories accessible
sudo chmod 755 /etc/letsencrypt/live
sudo chmod 755 /etc/letsencrypt/archive
sudo chmod 755 /etc/letsencrypt/live/www.scootr.in
sudo chmod 755 /etc/letsencrypt/archive/www.scootr.in
sudo chmod 644 /etc/letsencrypt/archive/www.scootr.in/*.pem
```

---

## Docker Compose Configuration

### File Location
`/opt/docker/compose/loadbalancer/docker-compose-loadbalancer.yml`

### Configuration

```yaml
services:
  fsb.loadbalancer:
	image: takdirm/fsbloadbalancer:latest
	container_name: fsb.loadbalancer
	restart: unless-stopped
	user: root  # Required to read Let's Encrypt certificates
	build:
	  context: LoadBalancer/Inx.LoadBalancer
	  dockerfile: Dockerfile
	environment:
	  ASPNETCORE_ENVIRONMENT: Production
	  # Point to Let's Encrypt certificate files
	  LETS_ENCRYPT_CERT_PATH: /https/live/www.scootr.in/fullchain.pem
	  LETS_ENCRYPT_KEY_PATH: /https/live/www.scootr.in/privkey.pem
	ports:
	  - "80:80"
	  - "443:443"
	volumes:
	  # Mount Let's Encrypt certificates (read-only)
	  - /etc/letsencrypt:/https:ro
	  # Configuration and logs
	  - /opt/projects/loadbalancer/conf/appsettings.json:/app/appsettings.json:ro
	  - /opt/projects/loadbalancer/logs/log4net.balancer.config:/app/log4net.balancer.config:ro
	  - /opt/projects/loadbalancer/logs:/app/logs
	networks:
	  - scootrnet
networks:
  scootrnet:
	external: true
```

### Start Container

```bash
cd /opt/docker/compose/loadbalancer
docker compose -f docker-compose-loadbalancer.yml up -d
docker logs -f fsb.loadbalancer
```

**Expected output:**
```
✓ SSL certificate found, enabling HTTPS on port 443
Load Balancer application started successfully
```

---

## Automatic Renewal Setup

### 1. Create Scripts Directory

```bash
sudo mkdir -p /opt/scripts
```

### 2. Create Renewal Script

**File**: `/opt/scripts/renew-letsencrypt.sh`

```bash
sudo tee /opt/scripts/renew-letsencrypt.sh > /dev/null << 'EOF'
#!/bin/bash
# Let's Encrypt certificate renewal script for FSB Load Balancer
# Logs to /var/log/letsencrypt-renewal.log

LOGFILE="/var/log/letsencrypt-renewal.log"
CONTAINER_NAME="fsb.loadbalancer"

log() {
	echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOGFILE"
}

log "========================================="
log "Starting Let's Encrypt certificate renewal check"

# Try to renew certificates (certbot only renews if expiring within 30 days)
if certbot renew --quiet --deploy-hook "/opt/scripts/post-renewal.sh" >> "$LOGFILE" 2>&1; then
	log "✓ Certbot renew completed successfully"
else
	log "✗ Certbot renew failed or no action needed"
	exit 1
fi

log "Certificate renewal check completed"
log "========================================="
EOF

sudo chmod +x /opt/scripts/renew-letsencrypt.sh
```

### 3. Create Post-Renewal Hook

**File**: `/opt/scripts/post-renewal.sh`

```bash
sudo tee /opt/scripts/post-renewal.sh > /dev/null << 'EOF'
#!/bin/bash
# Post-renewal hook - runs only when certificates are actually renewed
# Fixes permissions and restarts the container

LOGFILE="/var/log/letsencrypt-renewal.log"
CONTAINER_NAME="fsb.loadbalancer"

log() {
	echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOGFILE"
}

log "Certificate was renewed! Running post-renewal tasks..."

# Fix permissions on renewed certificates
log "Fixing permissions on certificate files..."
chmod 755 /etc/letsencrypt/live /etc/letsencrypt/archive
chmod 755 /etc/letsencrypt/live/www.scootr.in /etc/letsencrypt/archive/www.scootr.in
chmod 644 /etc/letsencrypt/archive/www.scootr.in/*.pem

# Restart the load balancer container to pick up new certificates
log "Restarting $CONTAINER_NAME container..."
if docker restart "$CONTAINER_NAME"; then
	log "✓ Container restarted successfully"
	sleep 3
	# Check if container is running
	if docker ps | grep -q "$CONTAINER_NAME"; then
		log "✓ Container is running with renewed certificate"
	else
		log "✗ Warning: Container failed to start after restart"
		docker logs --tail 20 "$CONTAINER_NAME" >> "$LOGFILE" 2>&1
	fi
else
	log "✗ Failed to restart container"
	exit 1
fi

log "✓ Post-renewal tasks completed"
EOF

sudo chmod +x /opt/scripts/post-renewal.sh
```

### 4. Create systemd Service

**File**: `/etc/systemd/system/letsencrypt-renewal.service`

```bash
sudo tee /etc/systemd/system/letsencrypt-renewal.service > /dev/null << 'EOF'
[Unit]
Description=Let's Encrypt Certificate Renewal for FSB Load Balancer
After=network.target docker.service

[Service]
Type=oneshot
ExecStart=/opt/scripts/renew-letsencrypt.sh
User=root
StandardOutput=journal
StandardError=journal
EOF
```

### 5. Create systemd Timer

**File**: `/etc/systemd/system/letsencrypt-renewal.timer`

```bash
sudo tee /etc/systemd/system/letsencrypt-renewal.timer > /dev/null << 'EOF'
[Unit]
Description=Timer for Let's Encrypt Certificate Renewal
Requires=letsencrypt-renewal.service

[Timer]
# Run twice daily at 3:30 AM and 3:30 PM
OnCalendar=03:30
OnCalendar=15:30
# Run 5 minutes after boot if missed
Persistent=true

[Install]
WantedBy=timers.target
EOF
```

### 6. Enable and Start Timer

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable timer to start on boot
sudo systemctl enable letsencrypt-renewal.timer

# Start timer immediately
sudo systemctl start letsencrypt-renewal.timer

# Verify timer is active
sudo systemctl status letsencrypt-renewal.timer
```

### 7. Setup Log Rotation

**File**: `/etc/logrotate.d/letsencrypt-renewal`

```bash
sudo tee /etc/logrotate.d/letsencrypt-renewal > /dev/null << 'EOF'
/var/log/letsencrypt-renewal.log {
	weekly
	rotate 12
	compress
	delaycompress
	missingok
	notifempty
	create 0644 root root
}
EOF
```

---

## Testing & Verification

### Test Renewal Script

```bash
# Run renewal script manually
sudo /opt/scripts/renew-letsencrypt.sh

# Check log output
sudo tail -f /var/log/letsencrypt-renewal.log
```

### Force Certificate Renewal (Testing Only)

**⚠️ Warning: Use sparingly due to Let's Encrypt rate limits**

```bash
# Force renewal even if not expiring soon
sudo certbot renew --force-renewal --deploy-hook "/opt/scripts/post-renewal.sh"

# Verify container restarted
docker ps | grep fsb.loadbalancer

# Check container logs
docker logs fsb.loadbalancer | tail -20
```

### Dry Run (No Actual Renewal)

```bash
# Test renewal process without actually renewing
sudo certbot renew --dry-run

# Check for any errors
echo $?  # Should output 0 for success
```

### Verify HTTPS is Working

```bash
# Test from server
curl -vk https://scootr.in/
curl -vk https://api.scootr.in/

# Check certificate details
echo | openssl s_client -servername scootr.in -connect localhost:443 2>/dev/null | openssl x509 -noout -dates

# Test all domains
for domain in scootr.in api.scootr.in admin.scootr.in snehajadhav.com www.snehajadhav.com; do
  echo "Testing $domain..."
  curl -Is https://$domain/ | head -1
done
```

### Check Container Logs

```bash
# Real-time logs
docker logs -f fsb.loadbalancer

# Last 50 lines
docker logs --tail 50 fsb.loadbalancer

# Filter for certificate-related messages
docker logs fsb.loadbalancer 2>&1 | grep -i "ssl\|certificate\|https"
```

---

## Troubleshooting

### Certificate Not Found Error

**Symptom**: "SSL certificate not found, HTTPS disabled"

**Solution**:
```bash
# Verify files exist
sudo ls -la /etc/letsencrypt/live/www.scootr.in/

# Check inside container
docker exec fsb.loadbalancer ls -la /https/live/www.scootr.in/

# Verify environment variables
docker exec fsb.loadbalancer env | grep LETS_ENCRYPT
```

### Permission Denied Error

**Symptom**: "Access to the path '/https/live/www.scootr.in/privkey.pem' is denied"

**Solution**:
```bash
# Fix permissions on host
sudo chmod 755 /etc/letsencrypt/live /etc/letsencrypt/archive
sudo chmod 755 /etc/letsencrypt/live/www.scootr.in
sudo chmod 755 /etc/letsencrypt/archive/www.scootr.in
sudo chmod 644 /etc/letsencrypt/archive/www.scootr.in/*.pem

# Or ensure container runs as root (already configured in docker-compose)
docker exec fsb.loadbalancer whoami  # Should output: root

# Restart container
docker restart fsb.loadbalancer
```

### Symlink Issues

**Symptom**: Container can't read certificate files even though they exist

**Solution**: Use archive files directly instead of symlinks
```yaml
# Update docker-compose-loadbalancer.yml environment:
environment:
  LETS_ENCRYPT_CERT_PATH: /https/archive/www.scootr.in/fullchain1.pem
  LETS_ENCRYPT_KEY_PATH: /https/archive/www.scootr.in/privkey1.pem
```

### Renewal Script Not Executing

```bash
# Check script permissions
ls -l /opt/scripts/renew-letsencrypt.sh
# Should be: -rwxr-xr-x with root owner

# Check for Windows line endings
file /opt/scripts/renew-letsencrypt.sh
# Should NOT say "CRLF line terminators"

# Fix line endings if needed
sudo apt-get install -y dos2unix
sudo dos2unix /opt/scripts/renew-letsencrypt.sh
sudo dos2unix /opt/scripts/post-renewal.sh
```

### Timer Not Running

```bash
# Check timer status
sudo systemctl status letsencrypt-renewal.timer

# View timer schedule
sudo systemctl list-timers --all | grep letsencrypt

# Check for errors
sudo journalctl -u letsencrypt-renewal.service -n 50

# Restart timer
sudo systemctl restart letsencrypt-renewal.timer
```

### Rate Limit Errors

**Symptom**: "too many certificates already issued"

**Solution**:
- Wait 1 week before requesting more certificates
- Let's Encrypt allows 50 certificates per domain per week
- Use `--dry-run` for testing
- Consider using staging environment for testing:
  ```bash
  certbot certonly --staging --standalone -d example.com
  ```

---

## Maintenance Commands

### Check Certificate Expiration

```bash
# View all certificates and expiration dates
sudo certbot certificates

# Check specific certificate
openssl x509 -in /etc/letsencrypt/live/www.scootr.in/cert.pem -noout -dates

# Check when renewal is due
sudo certbot renew --dry-run
```

### View Renewal History

```bash
# View renewal log
sudo cat /var/log/letsencrypt-renewal.log

# View certbot logs
sudo cat /var/log/letsencrypt/letsencrypt.log

# View systemd journal for renewal service
sudo journalctl -u letsencrypt-renewal.service
```

### Manual Timer Trigger (for Testing)

```bash
# Trigger the service manually
sudo systemctl start letsencrypt-renewal.service

# Watch logs in real-time
sudo journalctl -u letsencrypt-renewal.service -f
```

### Check Timer Next Run Time

```bash
# View when timer will run next
sudo systemctl list-timers letsencrypt-renewal.timer

# View timer details
sudo systemctl status letsencrypt-renewal.timer
```

### Revoke Certificate (if compromised)

```bash
# Revoke and delete certificate
sudo certbot revoke --cert-path /etc/letsencrypt/live/www.scootr.in/cert.pem

# Request new certificate
sudo certbot certonly --standalone \
  -d scootr.in -d api.scootr.in -d admin.scootr.in \
  --email youremail@example.com --agree-tos --no-eff-email
```

### Backup Certificates

```bash
# Create backup directory
sudo mkdir -p /backup/letsencrypt

# Backup entire letsencrypt directory
sudo tar -czf /backup/letsencrypt/letsencrypt-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt

# List backups
ls -lh /backup/letsencrypt/
```

### Restore Certificates

```bash
# Stop certbot services
sudo systemctl stop letsencrypt-renewal.timer

# Restore from backup
sudo tar -xzf /backup/letsencrypt/letsencrypt-backup-YYYYMMDD.tar.gz -C /

# Fix permissions
sudo chmod 755 /etc/letsencrypt/live /etc/letsencrypt/archive
sudo chmod 644 /etc/letsencrypt/archive/www.scootr.in/*.pem

# Restart services
docker restart fsb.loadbalancer
sudo systemctl start letsencrypt-renewal.timer
```

### Update Email Address

```bash
# Update account email
sudo certbot update_account --email newemail@example.com
```

### Delete Certificate (if no longer needed)

```bash
# List all certificates
sudo certbot certificates

# Delete specific certificate
sudo certbot delete --cert-name www.scootr.in
```

---

## Quick Reference Commands

```bash
# Check certificate expiry
sudo certbot certificates

# Check timer status
sudo systemctl status letsencrypt-renewal.timer

# View renewal log
sudo tail -f /var/log/letsencrypt-renewal.log

# Test renewal (dry run)
sudo certbot renew --dry-run

# Restart load balancer
docker restart fsb.loadbalancer

# Check container logs
docker logs fsb.loadbalancer | tail -20

# View next scheduled renewal
sudo systemctl list-timers letsencrypt-renewal.timer

# Manual renewal test
sudo /opt/scripts/renew-letsencrypt.sh

# Check HTTPS status
curl -Ik https://scootr.in/
```

---

## Important Notes

1. **Renewal Timing**: Certificates auto-renew 30 days before expiry
2. **Container Restart**: Container must restart after renewal to load new certificates
3. **Permissions**: Certificate files must be readable by the container (644 permissions)
4. **Monitoring**: Check `/var/log/letsencrypt-renewal.log` regularly
5. **Rate Limits**: Let's Encrypt allows 50 certificates per domain per week
6. **Backup**: Regular backups recommended before major changes

---

## Support & References

- Let's Encrypt Documentation: https://letsencrypt.org/docs/
- Certbot Documentation: https://eff-certbot.readthedocs.io/
- Let's Encrypt Rate Limits: https://letsencrypt.org/docs/rate-limits/
- systemd Timer Documentation: https://www.freedesktop.org/software/systemd/man/systemd.timer.html

---

**Last Updated**: August 2024  
**Maintained By**: FSB Server Admin  
**Server**: fsb-server (Ubuntu)

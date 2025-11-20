# AISG - Self-Hosting Deployment Guide

**Version**: 1.0  
**Last Updated**: October 23, 2025  
**Target**: Ubuntu 22.04 LTS (or similar Linux server)

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Server Setup](#2-server-setup)
3. [Database Setup (PostgreSQL)](#3-database-setup-postgresql)
4. [Application Deployment](#4-application-deployment)
5. [Environment Configuration](#5-environment-configuration)
6. [Build & Run](#6-build--run)
7. [Process Management (PM2)](#7-process-management-pm2)
8. [Nginx Reverse Proxy](#8-nginx-reverse-proxy)
9. [SSL Certificate (HTTPS)](#9-ssl-certificate-https)
10. [Monitoring & Logs](#10-monitoring--logs)
11. [Backup Strategy](#11-backup-strategy)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

### 1.1 Server Requirements

**Minimum Specifications**:
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB SSD
- OS: Ubuntu 22.04 LTS (recommended) or similar Linux distribution
- Network: Public IP address with open ports 80, 443

**Recommended for Production**:
- CPU: 4 cores
- RAM: 8 GB
- Storage: 50 GB SSD
- Backup storage: Additional 20 GB for database backups

### 1.2 Required Services

1. **Domain Name** (optional but recommended):
   - Example: `aisg.yourdomain.com`
   - DNS configured to point to your server IP

2. **OpenAI API Key** (for AI Chat feature):
   - Create account: https://platform.openai.com
   - Top up credits: $5-10 USD minimum
   - Generate API key: https://platform.openai.com/api-keys

3. **SSH Access** to your server:
   ```bash
   ssh root@your-server-ip
   # Or with key:
   ssh -i ~/.ssh/your-key.pem ubuntu@your-server-ip
   ```

### 1.3 What You'll Install

- Node.js 20.x (LTS)
- PostgreSQL 16
- Nginx (reverse proxy)
- PM2 (process manager)
- Certbot (SSL certificates)

---

## 2. Server Setup

### 2.1 Update System

```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

### 2.2 Install Node.js 20.x

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### 2.3 Create Application User (Security Best Practice)

```bash
# Create dedicated user for the app (not root!)
sudo useradd -m -s /bin/bash aisg

# Set password (optional)
sudo passwd aisg

# Add to sudo group (if needed)
sudo usermod -aG sudo aisg

# Switch to aisg user
sudo su - aisg
```

**Important**: Run the application as `aisg` user, NOT as `root` for security!

---

## 3. Database Setup (PostgreSQL)

### 3.1 Install PostgreSQL 16

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Import repository signing key
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update package lists
sudo apt update

# Install PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-contrib-16

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version  # Should show 16.x
```

### 3.2 Create Database & User

```bash
# Switch to postgres user
sudo su - postgres

# Open PostgreSQL prompt
psql

# In PostgreSQL prompt, run these commands:
```

```sql
-- Create database
CREATE DATABASE aisg_production;

-- Create user with password (CHANGE THIS PASSWORD!)
CREATE USER aisg_user WITH ENCRYPTED PASSWORD 'your_super_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE aisg_production TO aisg_user;

-- Connect to database
\c aisg_production

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO aisg_user;

-- Enable UUID extension (required for AISG)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Exit PostgreSQL
\q
```

```bash
# Exit postgres user
exit
```

### 3.3 Configure PostgreSQL for Remote Access (if needed)

**Only do this if your database is on a different server!**

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf

# Find and change:
listen_addresses = '*'  # Or specific IP

# Edit pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Add this line (replace with your app server IP):
host    aisg_production    aisg_user    192.168.1.100/32    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 3.4 Test Database Connection

```bash
# From your aisg user
psql -h localhost -U aisg_user -d aisg_production

# Should prompt for password
# If successful, you'll see:
aisg_production=>

# Exit
\q
```

---

## 4. Application Deployment

### 4.1 Upload ZIP File to Server

**Option 1: Using SCP (from your local machine)**

```bash
# From your local machine (where you downloaded the ZIP)
scp aisg-download.zip aisg@your-server-ip:/home/aisg/
```

**Option 2: Using SFTP**

```bash
sftp aisg@your-server-ip
put aisg-download.zip
exit
```

**Option 3: Upload via hosting panel** (if your provider has file manager)

### 4.2 Extract ZIP File

```bash
# SSH into server as aisg user
sudo su - aisg

# Create app directory
mkdir -p /home/aisg/apps
cd /home/aisg/apps

# Move ZIP file here
mv /home/aisg/aisg-download.zip .

# Extract ZIP
unzip aisg-download.zip

# Rename folder to something clean (if needed)
mv aisg-download aisg
# Or if ZIP already extracts to folder:
cd aisg

# Verify files
ls -la
# Should see: client/, server/, shared/, package.json, etc.
```

### 4.3 Install Dependencies

```bash
# Navigate to app directory
cd /home/aisg/apps/aisg

# Install Node.js dependencies
npm install

# This will install all packages from package.json
# Should take 2-5 minutes depending on server speed

# Verify installation
ls node_modules/  # Should see many packages
```

---

## 5. Environment Configuration

### 5.1 Create .env File

```bash
# In /home/aisg/apps/aisg directory
nano .env
```

**Paste this content** (customize the values):

```env
# Node Environment
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://aisg_user:your_super_secure_password_here@localhost:5432/aisg_production

# PostgreSQL Direct Connection (for Drizzle)
PGHOST=localhost
PGPORT=5432
PGUSER=aisg_user
PGPASSWORD=your_super_secure_password_here
PGDATABASE=aisg_production

# Session Secret (generate random string)
SESSION_SECRET=your_random_secret_here_change_this_to_something_very_random

# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Server Configuration
PORT=5000
HOST=0.0.0.0
```

**How to generate SESSION_SECRET**:

```bash
# Generate random 32-character string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy the output and paste it as SESSION_SECRET value
```

**Save and exit**: Ctrl+X, then Y, then Enter

### 5.2 Secure .env File

```bash
# Make .env readable only by owner
chmod 600 .env

# Verify
ls -la .env
# Should show: -rw------- (owner read/write only)
```

---

## 6. Build & Run

### 6.1 Run Database Migrations

```bash
# In /home/aisg/apps/aisg directory

# Push database schema (creates tables)
npm run db:push

# You should see:
# ✓ Tables created successfully
```

**If you see errors**, check:
1. DATABASE_URL is correct
2. PostgreSQL is running: `sudo systemctl status postgresql`
3. Database `aisg_production` exists
4. User `aisg_user` has proper permissions

### 6.2 Build Frontend

```bash
# Build Vite frontend for production
npm run build

# This creates: client/dist/ folder with optimized assets
# Should take 1-2 minutes

# Verify build
ls -la client/dist/
# Should see: index.html, assets/, etc.
```

### 6.3 Test Application (Development Mode)

```bash
# Start in development mode (to test)
npm run dev

# You should see:
# [express] Server running on http://0.0.0.0:5000
# [vite] ready in XXXms

# Test from another terminal:
curl http://localhost:5000

# Should return HTML or "Cannot GET /" (that's OK)

# Stop the dev server: Ctrl+C
```

### 6.4 Production Server Script

**Create production start script**:

```bash
nano start-production.sh
```

**Paste this content**:

```bash
#!/bin/bash
export NODE_ENV=production
export PORT=5000
export HOST=0.0.0.0

# Start Express server (serves both frontend and backend)
node --loader tsx server/index.ts
```

**Make executable**:

```bash
chmod +x start-production.sh
```

**Test production mode**:

```bash
./start-production.sh

# Should start without Vite (serves from client/dist/)
# Ctrl+C to stop
```

---

## 7. Process Management (PM2)

**PM2** keeps your app running 24/7, auto-restarts on crashes, and manages logs.

### 7.1 Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify
pm2 --version
```

### 7.2 Create PM2 Ecosystem File

```bash
# In /home/aisg/apps/aisg directory
nano ecosystem.config.js
```

**Paste this content**:

```javascript
module.exports = {
  apps: [{
    name: 'aisg-production',
    script: './start-production.sh',
    cwd: '/home/aisg/apps/aisg',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      HOST: '0.0.0.0'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }]
};
```

### 7.3 Create Logs Directory

```bash
mkdir -p logs
```

### 7.4 Start Application with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# You should see:
# ┌─────┬──────────────────┬─────────┬─────────┬─────────┐
# │ id  │ name             │ status  │ restart │ uptime  │
# ├─────┼──────────────────┼─────────┼─────────┼─────────┤
# │ 0   │ aisg-production  │ online  │ 0       │ 0s      │
# └─────┴──────────────────┴─────────┴─────────┴─────────┘

# Check status
pm2 status

# View logs (real-time)
pm2 logs aisg-production

# Stop logs: Ctrl+C

# Test application
curl http://localhost:5000
# Should return HTML content
```

### 7.5 PM2 Auto-Start on Server Reboot

```bash
# Generate startup script
pm2 startup

# This will print a command like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u aisg --hp /home/aisg

# Copy and run that command exactly

# Save current PM2 process list
pm2 save

# Now PM2 will auto-start on server reboot!
```

### 7.6 PM2 Commands Cheatsheet

```bash
# View status
pm2 status

# View logs
pm2 logs aisg-production
pm2 logs aisg-production --lines 100  # Last 100 lines

# Restart application
pm2 restart aisg-production

# Stop application
pm2 stop aisg-production

# Delete from PM2
pm2 delete aisg-production

# Monitor CPU/Memory
pm2 monit
```

---

## 8. Nginx Reverse Proxy

**Nginx** serves as reverse proxy, handling HTTPS and forwarding requests to your Node.js app.

### 8.1 Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Test from browser: http://your-server-ip
# Should see "Welcome to nginx!"
```

### 8.2 Configure Nginx for AISG

```bash
# Create Nginx config file
sudo nano /etc/nginx/sites-available/aisg
```

**Paste this content** (replace `aisg.yourdomain.com` with your domain or IP):

```nginx
# HTTP Server (will redirect to HTTPS later)
server {
    listen 80;
    listen [::]:80;
    
    server_name aisg.yourdomain.com;  # CHANGE THIS to your domain or IP
    
    # Increase client body size for file uploads
    client_max_body_size 10M;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # WebSocket support (if needed in future)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Forward headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Logs
    access_log /var/log/nginx/aisg-access.log;
    error_log /var/log/nginx/aisg-error.log;
}
```

**Save and exit**: Ctrl+X, Y, Enter

### 8.3 Enable Nginx Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/aisg /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Should see:
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Reload Nginx
sudo systemctl reload nginx
```

### 8.4 Test Application via Nginx

```bash
# From browser, visit:
http://aisg.yourdomain.com
# Or if no domain:
http://your-server-ip

# You should see AISG homepage!
```

**If you see errors**:
1. Check PM2 is running: `pm2 status`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/aisg-error.log`
3. Check app logs: `pm2 logs aisg-production`

---

## 9. SSL Certificate (HTTPS)

**Certbot** provides free SSL certificates from Let's Encrypt.

### 9.1 Install Certbot

```bash
# Install Certbot and Nginx plugin
sudo apt install -y certbot python3-certbot-nginx
```

### 9.2 Obtain SSL Certificate

**Prerequisites**:
- Domain name configured (DNS pointing to your server)
- Port 80 open (firewall allows HTTP)

```bash
# Run Certbot
sudo certbot --nginx -d aisg.yourdomain.com

# Follow prompts:
# 1. Enter email address (for renewal notifications)
# 2. Agree to Terms of Service: Y
# 3. Share email with EFF: N (optional)
# 4. Redirect HTTP to HTTPS: 2 (Yes, recommended)

# Certbot will:
# - Verify domain ownership
# - Obtain SSL certificate
# - Auto-configure Nginx for HTTPS
# - Set up HTTP → HTTPS redirect
```

**Expected output**:
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/aisg.yourdomain.com/fullchain.pem
Key is saved at: /etc/letsencrypt/live/aisg.yourdomain.com/privkey.pem
```

### 9.3 Test HTTPS

```bash
# Visit your site:
https://aisg.yourdomain.com

# Should show:
# - Padlock icon (secure)
# - AISG homepage loads
```

### 9.4 Auto-Renewal Setup

```bash
# Certbot auto-renewal is enabled by default
# Test renewal process:
sudo certbot renew --dry-run

# Should see:
# Congratulations, all renewals succeeded!

# Certificate auto-renews every 60 days (expires after 90)
```

### 9.5 Firewall Configuration (UFW)

**If you have firewall enabled**:

```bash
# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 10. Monitoring & Logs

### 10.1 Application Logs

**PM2 Logs**:
```bash
# View real-time logs
pm2 logs aisg-production

# View last 100 lines
pm2 logs aisg-production --lines 100

# View only errors
pm2 logs aisg-production --err

# Log files location
ls -la /home/aisg/apps/aisg/logs/
```

**Nginx Logs**:
```bash
# Access log (requests)
sudo tail -f /var/log/nginx/aisg-access.log

# Error log
sudo tail -f /var/log/nginx/aisg-error.log
```

**PostgreSQL Logs**:
```bash
# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### 10.2 System Monitoring

**Disk Usage**:
```bash
df -h
# Check available disk space
```

**Memory Usage**:
```bash
free -h
# Check RAM usage
```

**CPU Usage**:
```bash
top
# Press 'q' to quit
```

**Process Monitoring**:
```bash
# PM2 real-time monitoring
pm2 monit

# Shows:
# - CPU usage
# - Memory usage
# - Logs
```

### 10.3 Database Monitoring

**Check database size**:
```bash
sudo su - postgres
psql -d aisg_production -c "SELECT pg_size_pretty(pg_database_size('aisg_production'));"
exit
```

**Active connections**:
```bash
sudo su - postgres
psql -d aisg_production -c "SELECT count(*) FROM pg_stat_activity;"
exit
```

### 10.4 Uptime Monitoring (Optional)

**Install Uptime Robot** (free external monitoring):
1. Visit: https://uptimerobot.com
2. Create free account
3. Add monitor: https://aisg.yourdomain.com
4. Get alerts via email if site goes down

---

## 11. Backup Strategy

### 11.1 Database Backups

**Create backup script**:

```bash
# Create backup directory
mkdir -p /home/aisg/backups
cd /home/aisg/backups

# Create backup script
nano backup-database.sh
```

**Paste this content**:

```bash
#!/bin/bash

# Configuration
DB_NAME="aisg_production"
DB_USER="aisg_user"
BACKUP_DIR="/home/aisg/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/aisg_backup_$DATE.sql.gz"

# Create backup
PGPASSWORD='your_super_secure_password_here' pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "aisg_backup_*.sql.gz" -mtime +7 -delete

# Log
echo "Backup created: $BACKUP_FILE"
```

**Make executable**:
```bash
chmod +x backup-database.sh
```

**Test backup**:
```bash
./backup-database.sh

# Check backup file
ls -lh /home/aisg/backups/
```

### 11.2 Automated Daily Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add this line (backup at 2 AM daily):
0 2 * * * /home/aisg/backups/backup-database.sh >> /home/aisg/backups/backup.log 2>&1

# Save and exit
```

**Verify cron job**:
```bash
crontab -l
```

### 11.3 Restore from Backup

```bash
# List backups
ls -lh /home/aisg/backups/

# Restore from backup file
gunzip < /home/aisg/backups/aisg_backup_20251023_020000.sql.gz | \
  PGPASSWORD='your_super_secure_password_here' \
  psql -h localhost -U aisg_user -d aisg_production

# Restart application
pm2 restart aisg-production
```

### 11.4 File Backups (Application Code)

```bash
# Backup application files
cd /home/aisg
tar -czf aisg_app_backup_$(date +%Y%m%d).tar.gz apps/aisg/

# Or use rsync to remote server
rsync -avz /home/aisg/apps/aisg/ user@backup-server:/backups/aisg/
```

---

## 12. Troubleshooting

### 12.1 Application Won't Start

**Check PM2 status**:
```bash
pm2 status
pm2 logs aisg-production --lines 50
```

**Common issues**:
1. **Port 5000 already in use**:
   ```bash
   # Find process using port 5000
   sudo lsof -i :5000
   
   # Kill process
   sudo kill -9 <PID>
   ```

2. **Database connection error**:
   ```bash
   # Check PostgreSQL is running
   sudo systemctl status postgresql
   
   # Test connection
   psql -h localhost -U aisg_user -d aisg_production
   
   # Check DATABASE_URL in .env
   cat .env | grep DATABASE_URL
   ```

3. **Missing dependencies**:
   ```bash
   cd /home/aisg/apps/aisg
   npm install
   pm2 restart aisg-production
   ```

### 12.2 Nginx Errors

**502 Bad Gateway**:
- Node.js app is not running
  ```bash
  pm2 status  # Check if running
  pm2 restart aisg-production
  ```

**504 Gateway Timeout**:
- Request taking too long
  ```bash
  # Check app logs for slow operations
  pm2 logs aisg-production
  ```

**Nginx won't start**:
```bash
# Check config syntax
sudo nginx -t

# Check error log
sudo tail -f /var/log/nginx/error.log
```

### 12.3 SSL Certificate Issues

**Certificate expired**:
```bash
# Renew manually
sudo certbot renew

# Check auto-renewal
sudo systemctl status certbot.timer
```

**Certificate not applying**:
```bash
# Reload Nginx
sudo systemctl reload nginx
```

### 12.4 Database Issues

**Can't connect to database**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

**Database full**:
```bash
# Check disk space
df -h

# Check database size
sudo su - postgres
psql -d aisg_production -c "SELECT pg_size_pretty(pg_database_size('aisg_production'));"
```

### 12.5 Performance Issues

**High CPU usage**:
```bash
# Check with PM2
pm2 monit

# Check with top
top
# Press '1' to see all cores
# Press 'M' to sort by memory
# Press 'P' to sort by CPU
```

**High memory usage**:
```bash
# Check memory
free -h

# Restart application
pm2 restart aisg-production
```

**Slow database queries**:
```bash
# Enable slow query log in PostgreSQL
sudo nano /etc/postgresql/16/main/postgresql.conf

# Add/uncomment:
log_min_duration_statement = 1000  # Log queries > 1 second

# Restart PostgreSQL
sudo systemctl restart postgresql

# View slow queries
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

---

## Appendix A: Quick Commands Reference

### Application Management
```bash
# Start application
pm2 start ecosystem.config.js

# Restart application
pm2 restart aisg-production

# Stop application
pm2 stop aisg-production

# View logs
pm2 logs aisg-production

# Monitor resources
pm2 monit
```

### Nginx Management
```bash
# Test config
sudo nginx -t

# Reload config
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/aisg-error.log
```

### Database Management
```bash
# Connect to database
psql -h localhost -U aisg_user -d aisg_production

# Backup database
./backup-database.sh

# Check database size
sudo su - postgres -c "psql -d aisg_production -c \"SELECT pg_size_pretty(pg_database_size('aisg_production'));\""
```

### SSL Certificate
```bash
# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

---

## Appendix B: Update Application

**When you have new version of AISG**:

```bash
# 1. Stop application
pm2 stop aisg-production

# 2. Backup current version
cd /home/aisg/apps
mv aisg aisg-backup-$(date +%Y%m%d)

# 3. Upload new ZIP file and extract
unzip aisg-new-version.zip
mv aisg-new-version aisg

# 4. Copy environment file
cp aisg-backup-*/env aisg/.env

# 5. Install dependencies
cd aisg
npm install

# 6. Run migrations (if database changed)
npm run db:push

# 7. Build frontend
npm run build

# 8. Start application
pm2 start ecosystem.config.js

# 9. Verify
pm2 logs aisg-production
```

---

## Appendix C: Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Use strong SESSION_SECRET (random 32+ characters)
- [ ] Firewall enabled (UFW) with only necessary ports
- [ ] SSH key-based authentication (disable password login)
- [ ] Keep system updated: `sudo apt update && sudo apt upgrade`
- [ ] Regular database backups (daily automated)
- [ ] SSL certificate enabled and auto-renewing
- [ ] Application running as non-root user (`aisg`)
- [ ] .env file permissions set to 600 (owner read/write only)
- [ ] OpenAI API key stored securely (not in code)

---

## Support

**If you encounter issues**:

1. Check logs:
   - PM2: `pm2 logs aisg-production`
   - Nginx: `sudo tail -f /var/log/nginx/aisg-error.log`
   - PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-16-main.log`

2. Verify services running:
   ```bash
   pm2 status
   sudo systemctl status nginx
   sudo systemctl status postgresql
   ```

3. Test database connection:
   ```bash
   psql -h localhost -U aisg_user -d aisg_production
   ```

4. Check system resources:
   ```bash
   df -h        # Disk space
   free -h      # Memory
   pm2 monit    # App resources
   ```

---

**END OF DEPLOYMENT GUIDE**

For technical documentation, see `AISG_Technical_Documentation.md`.  
For user manual, see `AISG_Manual_Book.txt`.

**Good luck with your deployment!** 🚀

# Unified Dashboard - VPS Deployment Guide

This guide helps you deploy both the blog generator and comment assistant on a single Azure VPS with a unified URL.

## Quick Start

### Option 1: Automated Script (Recommended for Blog Dashboard)

1. Make the scripts executable:
```bash
chmod +x deploy-vps.sh
chmod +x deploy-vps-comment.sh
```

2. Move to the unified dashboard directory on your VPS:
```bash
# On your local machine, prepare the upload:
scp -r E:\unified_dashboard user@your-vps:/tmp/

# On your VPS:
sudo rsync -av /tmp/unified-dashboard/ /opt/unified-dashboard/
sudo rsync -av /tmp/blog_generation_pipeline/ /opt/blog-dashboard/
```

3. Run the main deployment script:
```bash
sudo /opt/unified-dashboard/deploy-vps.sh
```

4. Run the comment dashboard script:
```bash
sudo /opt/unified-dashboard/deploy-vps-comment.sh
```

### Option 2: Manual Deployment

Follow the step-by-step guide below.

---

## Architecture Overview

```
User Browser → Nginx (Port 443) → Express Gateway (Port 8080)
                                      ├→ Blog Dashboard (Port 5000)
                                      └→ Comment Dashboard (Port 3500)
```

**Single URL Access Pattern:**
- `https://yourdomain.com` → Gateway (Landing page)
- `https://yourdomain.com/blog` → Blog Generator
- `https://yourdomain.com/comments` → Comment Assistant

---

## Prerequisites

- Azure VPS (Ubuntu 22.04+)
- Domain name pointed to VPS
- Domain control panel for SSL setup

---

## Step-by-Step Deployment

### Phase 1: Initial Setup

#### 1.1 Connect to VPS
```bash
ssh user@your-vps-ip
```

#### 1.2 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### 1.3 Install Dependencies
```bash
sudo apt install -y nginx python3-pip python3-certbot-openssl nodejs npm curl git
```

### Phase 2: Configure Environment Variables

#### 2.1 Create Directory Structure
```bash
sudo mkdir -p /opt/unified-dashboard
sudo mkdir -p /opt/blog-dashboard
sudo mkdir -p /opt/comment-dashboard
sudo mkdir -p /var/www/certbot
sudo mkdir -p /etc/letsencrypt/live/yourdomain.com
```

#### 2.2 Create .env Files

For **Blog Dashboard** (`/opt/blog-dashboard/.env`):
```bash
FLASK_APP=blog_platform.app:app
FLASK_ENV=production
PYTHONUNBUFFERED=1
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/megallm_blog_platform
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/megallm_blog_platform
MEGALLM_API_KEY=sk-mega-xxxxx
MEGALLM_BASE_URL=https://beta.megallm.io/v1
MEGALLM_MODEL_CONTENT=glm-5
MEGALLM_MODEL_FAST=glm-5
MEGALLM_MODEL_ANALYSIS=glm-5
SERPER_API_KEY=your-serper-key
FIRECRAWL_API_KEY=your-firecrawl-key
```

For **Unified Dashboard** (`/opt/unified-dashboard/.env`):
```bash
GATEWAY_PORT=8080
BLOG_DASHBOARD_URL=http://localhost:5000
COMMENT_DASHBOARD_URL=http://localhost:3500
MYSQL_URI=
REDIS_URL=
```

### Phase 3: Deploy Blog Generator

#### 3.1 Setup Blog Dashboard
```bash
cd /opt/blog-dashboard
sudo python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install flask pymongo pandas requests python-dotenv numpy
deactivate
```

#### 3.2 Set Permissions
```bash
sudo chmod -R 755 /opt/blog-dashboard
```

#### 3.3 Start Blog Service
```bash
sudo systemctl enable blog-dashboard
sudo systemctl start blog-dashboard
sudo systemctl status blog-dashboard
```

### Phase 4: Deploy Comment Assistant

#### 4.1 Copy Comment App
Use FileZilla, SCP, or Git:
```bash
# Option A: SCP from local machine
scp -r User/local/CommentApp user@vps:/opt/comment-dashboard/

# Option B: Git clone
cd /opt/comment-dashboard
git clone https://github.com/yourusername/comment-app.git .
```

#### 4.2 Setup Dependencies
```bash
cd /opt/comment-dashboard
sudo npm install --production
npm run build
```

#### 4.3 Start Comment Service
```bash
sudo systemctl enable comment-dashboard
sudo systemctl start comment-dashboard
sudo systemctl status comment-dashboard
```

### Phase 5: Deploy Express Gateway

The gateway is already included in the unified-dashboard. Start it:

```bash
cd /opt/unified-dashboard
sudo systemctl enable unified-gateway
sudo systemctl start unified-gateway
sudo systemctl status unified-gateway
```

### Phase 6: Configure Nginx

#### 6.1 Copy Nginx Configuration
```bash
sudo cp nginx.conf /etc/nginx/sites-available/unified-dashboard
```

#### 6.2 Edit Domain
```bash
sudo nano /etc/nginx/sites-available/unified-dashboard
```
Replace `example.com` with your actual domain.

#### 6.3 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/unified-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Phase 7: Set Up SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts to create a Let's Encrypt certificate.

---

## Managing Services

### View Logs
```bash
# Gateway logs
journalctl -u unified-gateway -f

# Blog dashboard logs
journalctl -u blog-dashboard -f

# Comment dashboard logs
journalctl -u comment-dashboard -f

# Nginx logs
tail -f /var/log/nginx/unified-dashboard.error.log
tail -f /var/log/nginx/unified-dashboard.access.log
```

### Restart Services
```bash
sudo systemctl restart unified-gateway
sudo systemctl restart blog-dashboard
sudo systemctl restart comment-dashboard
sudo systemctl restart nginx
```

### Stop Services
```bash
sudo systemctl stop unified-gateway
sudo systemctl stop blog-dashboard
sudo systemctl stop comment-dashboard
```

### Check Service Status
```bash
sudo systemctl status unified-gateway
sudo systemctl status blog-dashboard
sudo systemctl status comment-dashboard
```

---

## Testing the Deployment

### Health Check
```bash
curl http://localhost/health
curl http://localhost:8080/health
curl https://yourdomain.com/health
```

### Test Gateway
```bash
# Test backend proxies
curl http://localhost:8080/blog
curl http://localhost:8080/comments
```

### Firewall Configuration
```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Allow specific ports if needed
sudo ufw allow 5000/tcp
sudo ufw allow 3500/tcp
sudo ufw allow 8080/tcp
```

---

## Troubleshooting

### Issue: Services not starting

Check logs:
```bash
sudo journalctl -xe
```

Verify dependencies:
```bash
# Check Python packages
/opt/blog-dashboard/venv/bin/pip list

# Check Node packages
cd /opt/comment-dashboard
npm list --depth=0
```

### Issue: Nginx 502 Bad Gateway

Ensure services are running:
```bash
sudo systemctl status blog-dashboard comment-dashboard unified-gateway
```

Check service URLs:
```bash
curl http://localhost:5000/
curl http://localhost:3500/
curl http://localhost:8080/
```

### Issue: SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Check certificate status
sudo certbot certificates
```

### Issue: MongoDB Connection

Verify MongoDB URI format:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/megallm_blog_platform
```

Test connection:
```bash
cd /opt/blog-dashboard
source venv/bin/activate
python3 -c "from pymongo import MongoClient; client = MongoClient('MONGODB_URI'); print('Connected!')"
```

---

## File Structure

```
/opt/
├── unified-dashboard/
│   ├── server.js          # Express gateway
│   ├── package.json
│   ├── nginx.conf
│   └── public/
│       └── index.html     # Landing page
├── blog-dashboard/
│   ├── app.py             # Flask app
│   ├── blog_platform/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── blog_generator.py
│   ├── .env
│   └── venv/
└── comment-dashboard/
    ├── package.json
    ├── .next/
    ├── .env
    └── src/
        └── app/
            └── comments
```

---

## Monitoring and Maintenance

### Monitor Resource Usage
```bash
# CPU and memory
htop

# Disk usage
df -h

# Service resource usage
sudo systemctl status
```

### Set Up Automated Tasks
```bash
# Configure automatic SSL renewal (already in certbot)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Backup Configuration
```bash
# Backup .env files
tar -czf backup-env-$(date +%Y%m%d).tar.gz /opt/unified-dashboard/.env /opt/blog-dashboard/.env /opt/comment-dashboard/.env
```

---

## Security Hardening

1. **Change default passwords** in .env files
2. **Limit SSH access**:
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw deny 23/tcp  # Block telnet
   ```

3. **Set up fail2ban**:
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

4. **Regular updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo certbot renew
   ```

---

## Cost Optimization (Azure)

- Use **Azure Reserved Instances** for servers
- Monitor and set **auto-shutdown** for dev servers
- Use **App Service Plans** for production if scaling needed
- Enable **Azure Monitor** for performance tracking

---

## Support

If you encounter issues:
1. Check service logs: `journalctl -xe`
2. Verify Nginx config: `sudo nginx -t`
3. Test backend services: `curl http://localhost:PORT`
4. Review this troubleshooting section

---

**Last Updated:** 2026-04-15
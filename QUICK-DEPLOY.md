# Quick Deployment Guide - Unified Dashboard on Azure VPS

## Overview

You now have a complete unified dashboard with:
- **Single Domain URL**: https://yourdomain.com
- **Blog Generator**: https://yourdomain.com/blog
- **Comment Assistant**: https://yourdomain.com/comments

---

## What Files I Created

### 1. **nginx.conf**
   - Nginx configuration for SSL and reverse proxy
   - Configures routing for all three services
   - Includes security headers and WebSocket support

### 2. **deploy-vps.sh**
   - Automated deployment script for:
     - Blog dashboard setup
     - Required dependencies installation
     - Systemd service creation
     - Environment variable configuration
   - Run on your VPS: `chmod +x deploy-vps.sh && sudo ./deploy-vps.sh`

### 3. **deploy-vps-comment.sh**
   - Specific script to deploy comment assistant
   - Handles: copying files, dependencies, building
   - Run: `chmod +x deploy-vps-comment.sh && sudo ./deploy-vps-comment.sh`

### 4. **blog-dashboard.service**
   - Systemd service for Flask blog application
   - Runs on port 5000
   - Managed by systemd with auto-restart

### 5. **unified-gateway.service**
   - Systemd service for Express gateway
   - Runs on port 8080
   - Manages routing to both backends

### 6. **start.sh.new**
   - All-in-one startup script
   - Starts all three services in the correct order
   - Includes health checks and error handling

### 7. **DEPLOYMENT-GUIDE.md**
   - Complete step-by-step deployment instructions
   - Troubleshooting guide
   - Maintenance and monitoring tips

---

## Your Setup is Already Unified!

Notice your **server.js** already acts as a gateway:
```javascript
// Routes:
* http://localhost:8080        → Gateway (Landing page)
* http://localhost:8080/blog/* → Blog Dashboard (Flask)
* http://localhost:8080/comments → Comment Dashboard (Next.js)
```

You just needed:
1. ✅ Nginx reverse proxy on port 443
2. ✅ SSL certificates (Let's Encrypt)
3. ✅ Container/Process management (systemd)
4. ✅ Proper environment variables

---

## Deployment Options

### Option 1: Manual Components (Best for Testing)

1. **Deploy Blog**:
   ```bash
   cd /opt/blog-dashboard
   sudo python3 -m venv venv
   source venv/bin/activate
   pip install flask pymongo pandas requests python-dotenv
   sudo uvicorn blog_platform.app:app --host 0.0.0.0 --port 5000 --workers 4
   ```

2. **Deploy Comment**:
   ```bash
   cd /opt/comment-dashboard
   npm install
   npm run build
   npm start
   ```

3. **Deploy Gateway**:
   ```bash
   cd /opt/unified-dashboard
   node server.js
   ```

4. **Configure Nginx**:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/unified-dashboard
   sudo nano /etc/nginx/sites-available/unified-dashboard  # Change domain
   sudo ln -s /etc/nginx/sites-available/unified-dashboard /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **Setup SSL**:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

### Option 2: Use Automation Scripts (Recommended)

1. **Upload files to VPS**:
   ```bash
   # On your local machine:
   scp -r unified-dashboard/* root@your-vps:/opt/unified-dashboard/
   scp -r blog_generation_pipeline/* root@your-vps:/opt/blog-dashboard/
   scp -r NewComemnt-feature-x-assistant/* root@your-vps:/opt/comment-dashboard/
   ```

2. **Make scripts executable**:
   ```bash
   chmod +x deploy-vps.sh
   chmod +x deploy-vps-comment.sh
   ```

3. **Run deployment**:
   ```bash
   # Deploy blog dashboard
   sudo ./deploy-vps.sh

   # Deploy comment dashboard
   sudo ./deploy-vps-comment.sh
   ```

4. **Configure Nginx and SSL** (same as Option 1 step 4-5)

---

## Services Management Commands

### Start All Services
```bash
sudo systemctl start blog-dashboard comment-dashboard unified-gateway
sudo systemctl enable blog-dashboard comment-dashboard unified-gateway
```

### Stop All Services
```bash
sudo systemctl stop blog-dashboard comment-dashboard unified-gateway
```

### View Logs
```bash
# Gateway logs
sudo journalctl -u unified-gateway -f

# Blog dashboard logs
sudo journalctl -u blog-dashboard -f

# Comment dashboard logs
sudo journalctl -u comment-dashboard -f

# Manual log files
tail -f /var/log/unified-gateway.log
tail -f /var/log/blog-dashboard.log
tail -f /var/log/comment-dashboard.log

# Nginx logs
tail -f /var/log/nginx/unified-dashboard.error.log
tail -f /var/log/nginx/unified-dashboard.access.log
```

### Check Status
```bash
sudo systemctl status unified-gateway
sudo systemctl status blog-dashboard
sudo systemctl status comment-dashboard
```

---

## SSL Certificate Setup

After services are running:

```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Setup auto-renewal
sudo certbot renew --dry-run
```

---

## Testing Your Deployment

### Check Health
```bash
curl http://localhost/health
curl http://localhost:8080/health
curl https://yourdomain.com/health
```

### Access Dashboard
- **Gateway**: https://yourdomain.com
- **Blog Generator**: https://yourdomain.com/blog
- **Comment Assistant**: https://yourdomain.com/comments

### Test Internal Endpoints
```bash
curl http://localhost:5000/
curl http://localhost:3500/comments
curl http://localhost:8080/blog
curl http://localhost:8080/comments
```

---

## Important Notes

### Environment Variables - Critical!

You **must update** these in `.env` files on your VPS:

For **Blog Dashboard** (`/opt/blog-dashboard/.env`):
```bash
MONGODB_URI=your-mongodb-uri
DATABASE_URL=your-mongodb-uri
SERPER_API_KEY=your-serper-key
FIRECRAWL_API_KEY=your-firecrawl-key
MEGALLM_API_KEY=sk-xxx
```

For **Comment Dashboard** (`/opt/comment-dashboard/.env`):
```bash
MONGODB_URI=your-mongodb-uri
DATABASE_URL=your-mongodb-uri
MEGALLM_API_KEY=sk-xxx
MEGALLM_BASE_URL=https://beta.megallm.io/v1
UNIFIED_ASSISTANT_USER=your-email@megallm.io
UNIFIED_ASSISTANT_PASSWORD=your-password
```

### Firewall Configuration
```bash
# Allow traffic
sudo ufw allow 'Nginx Full'
sudo ufw status
```

### MongoDB Connection
If using MongoDB Atlas:
```bash
# Connection string format:
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

---

## File Upload Reference

On your **local machine**, you'll need to upload:

```
├── unified-dashboard/
│   ├── server.js
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   ├── nginx.conf
│   └── deploy-vps.sh
│
├── blog_generation_pipeline/
│   ├── app.py
│   └── blog_platform/
│       ├── config.py
│       ├── database.py
│       └── blog_generator.py
│
└── comment-dashboard/
    ├── package.json
    ├── .next/
    └── src/
        └── app/
            └── comments
```

Use:
- **FileZilla** for GUI upload
- **scp** command line: `scp -r local/path user@vps:/remote/path`

---

## Troubleshooting Quick Guide

| Issue | Command |
|-------|---------|
| Dashboard not starting | `journalctl -xe` |
| Database connection failed | Check `.env` MONGODB_URI |
| Nginx 502 | `sudo systemctl status blog-dashboard comment-dashboard` |
| SSL not working | `sudo certbot renew --force-renewal` |
| Port already in use | Find process: `sudo lsof -i :5000` |

---

## Summary

Your setup **already provides unified access** through `server.js` acting as a gateway. The files I created:

1. ✅ Automate the deployment process
2. ✅ Provide Nginx SSL configuration
3. ✅ Set up systemd service management
4. ✅ Include comprehensive documentation

**Next Steps:**
1. Upload files to your Azure VPS
2. Update `.env` files with your actual credentials
3. Run deployment scripts
4. Configure Nginx with your domain
5. Get SSL certificate

Your users can now access everything from: **https://yourdomain.com**

---

Need help? Check **DEPLOYMENT-GUIDE.md** for detailed troubleshooting.
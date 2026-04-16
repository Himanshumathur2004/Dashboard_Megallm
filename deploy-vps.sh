#!/bin/bash
# VPS Deployment Script
# Usage: ./deploy-vps.sh

set -e

echo "============================================"
echo "  Unified Dashboard - VPS Deployment"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="example.com"  # Replace with your domain
DOMAIN_WWW="www.example.com"
PROJECT_DIR="/opt/unified-dashboard"
BLOG_DIR="/opt/blog-dashboard"
COMMENT_DIR="/opt/comment-dashboard"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Update system
log_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install dependencies
log_info "Installing dependencies (nginx, python3, nodejs)..."
sudo apt install -y nginx python3-pip certbot python3-certbot-nginx nodejs npm

# Step 3: Create project directories
log_info "Creating project directories..."
sudo mkdir -p $PROJECT_DIR
sudo mkdir -p $BLOG_DIR
sudo mkdir -p $COMMENT_DIR
sudo mkdir -p /var/www/certbot

# Step 4: Copy project files
log_info "Copying project files..."
# Copy current directory contents to project folder
if [ -f "server.js" ]; then
    sudo cp server.js $PROJECT_DIR/
    sudo cp package.json $PROJECT_DIR/
    sudo cp nginx.conf $PROJECT_DIR/
    sudo cp -r public $PROJECT_DIR/
else
    log_error "server.js not found. Are you running from the right directory?"
    exit 1
fi

# Copy blog app
if [ -f "blog_generation_pipeline/app.py" ]; then
    sudo cp blog_generation_pipeline/app.py $BLOG_DIR/
    sudo cp blog_generation_pipeline/blog_platform/* $BLOG_DIR/
    sudo cp blog_generation_pipeline/blog_platform/__init__.py $BLOG_DIR/
else
    log_warn "Blog app files not found, creating minimal config"
    sudo mkdir -p $BLOG_DIR/blog_platform
fi

# Copy comment app
if [ -d "NewComemnt-feature-x-assistant" ]; then
    log_warn "Skipping comment app copy - update FileZilla/SCP as needed"
fi

# Step 5: Create .env file
log_info "Setting up environment variables..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    cat > $PROJECT_DIR/.env << 'EOF'
# Gateway Configuration
PORT=8080

# Backend URLs
BLOG_DASHBOARD_URL=http://localhost:5000
COMMENT_DASHBOARD_URL=http://localhost:3500

# Blog Dashboard Variables
FLASK_APP=blog_platform.app:app
FLASK_ENV=production
PYTHONUNBUFFERED=1

# Comment Dashboard Variables
NEXT_PORT=3500
MEGALLM_API_KEY=
MEGALLM_BASE_URL=https://beta.megallm.io/v1
MEGALLM_MODEL_CONTENT=glm-5
MEGALLM_MODEL_FAST=glm-5
MEGALLM_MODEL_ANALYSIS=glm-5

# MongoDB
MONGODB_URI=
MONGODB_DB=megallm_blog_platform

# API Keys
SERPER_API_KEY=
FIRECRAWL_API_KEY=

DEVTO_API_KEY=
DEVTO_USERNAME=
DEVTO_PUBLISH_IMMEDIATELY=true
DEVTO_DEFAULT_TAGS=megallm,viral,trending

UNIFIED_ASSISTANT_USER=
UNIFIED_ASSISTANT_PASSWORD=

GOOGLE_SERVICE_ACCOUNT_JSON=
GSC_SITE_URL=
EOF
    log_warn "Created .env template - UPDATE WITH YOUR VALUES!"
fi

# Step 6: Set permissions
log_info "Setting permissions..."
sudo chmod -R 755 $PROJECT_DIR
sudo chmod +x $PROJECT_DIR/*.sh

# Step 7: Create npm .npmrc
cat > $PROJECT_DIR/.npmrc << 'EOF'
registry=https://registry.npmmirror.com/
strict-ssl=false
EOF

# Step 8: Install Node dependencies
log_info "Installing Node.js dependencies..."
cd $PROJECT_DIR
npm install --production

# Step 9: Setup Blog Dashboard virtual environment
log_info "Setting up Python virtual environment..."
cd $BLOG_DIR
sudo python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install flask pymongo pandas requests python-dotenv
deactivate

# Step 10: Install Comment Dashboard dependencies
log_warn "Comment Dashboard dependencies need manual installation"
log_info "Run these commands on the server:"
echo "  cd $COMMENT_DIR"
echo "  npm install"
echo "  npm run build"

# Step 11: Create systemd services
log_info "Creating systemd services..."

# Blog Dashboard service
sudo tee /etc/systemd/system/blog-dashboard.service > /dev/null <<EOF
[Unit]
Description=Blog Dashboard Flask App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$BLOG_DIR
Environment="PATH=$BLOG_DIR/venv/bin"
ExecStart=$BLOG_DIR/venv/bin/gunicorn --bind 0.0.0.0:5000 --workers 4 --timeout 120 blog_platform.app:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Comment Dashboard service
sudo tee /etc/systemd/system/comment-dashboard.service > /dev/null <<EOF
[Unit]
Description=Comment Dashboard Next.js App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$COMMENT_DIR
Environment="PORT=3500"
Environment="MEGALLM_API_KEY="
Environment="MEGALLM_BASE_URL=https://beta.megallm.io/v1"
Environment="MEGALLM_MODEL_CONTENT=glm-5"
Environment="MEGALLM_MODEL_FAST=glm-5"
Environment="MEGALLM_MODEL_ANALYSIS=glm-5"
Environment="MONGODB_URI="
Environment="DATABASE_URL="
LimitNOFILE=65536
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Gateway service
sudo tee /etc/systemd/system/unified-gateway.service > /dev/null <<EOF
[Unit]
Description=Unified Dashboard Gateway
After=blog-dashboard.service comment-dashboard.service
Requires=blog-dashboard.service comment-dashboard.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 12: Create .npmrc for comment dashboard
cat > $COMMENT_DIR/.npmrc << 'EOF'
registry=https://registry.npmmirror.com/
strict-ssl=false
EOF

# Step 13: Reload systemd
log_info "Reloading systemd..."
sudo systemctl daemon-reload

log_info "============================================"
echo -e "${GREEN}Deployment setup complete!${NC}"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Update .env file with your actual values:"
echo "   nano $PROJECT_DIR/.env"
echo ""
echo "2. Update nginx.conf with your domain:"
echo "   nano $PROJECT_DIR/nginx.conf"
echo ""
echo "3. Copy blog app files to $BLOG_DIR"
echo "4. Copy comment app files to $COMMENT_DIR"
echo ""
echo "5. Grant permission:"
echo "   sudo chmod +x deploy-vps.sh"
echo ""
echo "6. Run certbot to get SSL:"
echo "   sudo certbot --nginx -d $DOMAIN -d $DOMAIN_WWW"
echo ""
echo "7. Start services:"
echo "   sudo systemctl start blog-dashboard comment-dashboard unified-gateway"
echo "   sudo systemctl enable blog-dashboard comment-dashboard unified-gateway"
echo ""
echo "8. Restart Nginx:"
echo "   sudo systemctl restart nginx"
echo ""
echo "9. Test the deployment:"
echo "   curl http://localhost/health"
echo "   curl http://localhost/blog/"
echo "   curl http://localhost/comments/"
echo ""
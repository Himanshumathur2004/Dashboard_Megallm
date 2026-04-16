#!/bin/bash
# Comment Dashboard Specific Deployment Script
# Run this on the server after deploying the blog app

set -e

echo "============================================"
echo "  Comment Dashboard Deployment"
echo "============================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

COMMENT_DIR="/opt/comment-dashboard"

# Step 1: Copy comment app files
log_info "Copying comment app files..."
# You need to upload files using FileZilla/SCP or git clone
# Example: scp -r NewComemnt-feature-x-assistant user@your-vps:/opt/comment-dashboard/

if [ ! -d "$COMMENT_DIR" ]; then
    log_error "Comment dashboard directory not found at $COMMENT_DIR"
    exit 1
fi

# Step 2: Create .npmrc
cat > $COMMENT_DIR/.npmrc << 'EOF'
registry=https://registry.npmmirror.com/
strict-ssl=false
EOF

# Step 3: Create required directories
log_info "Creating required directories..."
mkdir -p $COMMENT_DIR/data
mkdir -p $COMMENT_DIR/.next
mkdir -p $COMMENT_DIR/logs

# Step 4: Install dependencies
log_info "Installing Node.js dependencies..."
cd $COMMENT_DIR
npm install --production

# Step 5: Create .env file
log_info "Setting up environment variables..."
if [ ! -f "$COMMENT_DIR/.env" ]; then
    cat > $COMMENT_DIR/.env << 'EOF'
NEXT_PUBLIC_API_URL=
MEGALLM_API_KEY=
MEGALLM_BASE_URL=https://beta.megallm.io/v1
MEGALLM_MODEL_CONTENT=glm-5
MEGALLM_MODEL_FAST=glm-5
MEGALLM_MODEL_ANALYSIS=glm-5
MONGODB_URI=
DATABASE_URL=
SERPER_API_KEY=
FIRECRAWL_API_KEY=
TWITTERAPI_IO_KEY=
DEVTO_API_KEY=
DEVTO_USERNAME=
DEVTO_PUBLISH_IMMEDIATELY=true
DEVTO_DEFAULT_TAGS=megallm,viral,treanding
UNIFIED_ASSISTANT_USER=
UNIFIED_ASSISTANT_PASSWORD=
GOOGLE_SERVICE_ACCOUNT_JSON=
GSC_SITE_URL=
CRON_SECRET=
PIPELINE_ENABLED=true
PIPELINE_DRY_RUN=false
EOF
    log_warn "Created .env template - UPDATE WITH YOUR VALUES!"
fi

# Step 6: Build the application
log_info "Building Next.js application..."
npm run build

# Step 7: Start the service
log_info "Starting comment dashboard..."
sudo systemctl enable comment-dashboard
sudo systemctl start comment-dashboard

# Step 8: Check status
log_info "Checking service status..."
sleep 5
sudo systemctl status comment-dashboard --no-pager

log_info "============================================"
echo -e "${GREEN}Comment dashboard deployment complete!${NC}"
log_info "============================================"
echo ""
echo "View logs:"
echo "  journalctl -u comment-dashboard -f"
echo ""
echo "Check if running:"
echo "  curl http://localhost:3500/comments"
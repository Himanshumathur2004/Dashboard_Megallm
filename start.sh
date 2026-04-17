#!/bin/sh
# Complete startup script for VPS deployment/Docker
# This script starts all three services with proper dependencies

set -e

echo "============================================"
echo "  Unified Dashboard - Starting All Services"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to handle shutdown gracefully
cleanup() {
    echo "Stopping all services..."
    kill $Gateway_PID $Blog_PID $Comment_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# ============================================
# Start Blog Dashboard (Flask) - Port 5000
# ============================================
echo -e "${GREEN}Starting Blog Dashboard (Flask) on port 5000...${NC}"
cd /app/blog_generation_pipeline

if [ -d "venv" ]; then
    source venv/bin/activate
    export PATH=/app/blog_generation_pipeline/venv/bin:$PATH
fi

export FLASK_APP=blog_platform.app:app
export FLASK_ENV=production
export PYTHONUNBUFFERED=1
export FLASK_DEBUG=0
export MONGODB_URI=$MONGODB_URI
export DATABASE_URL=$DATABASE_URL
export MEGALLM_API_KEY=$MEGALLM_API_KEY
export MEGALLM_BASE_URL=$MEGALLM_BASE_URL
export MEGALLM_MODEL_CONTENT=$MEGALLM_MODEL_CONTENT
export MEGALLM_MODEL_FAST=$MEGALLM_MODEL_FAST
export MEGALLM_MODEL_ANALYSIS=$MEGALLM_MODEL_ANALYSIS
export SERPER_API_KEY=$SERPER_API_KEY
export FIRECRAWL_API_KEY=$FIRECRAWL_API_KEY

# Start Flask using wrapper script - Generate random SECRET_KEY
export SECRET_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
nohup /app/start-blog.sh > /var/log/blog-dashboard.log 2>&1 &

Blog_PID=$!
echo -e "${GREEN}Blog Dashboard started (PID: $Blog_PID)${NC}"
[ -d "venv" ] && deactivate

# ============================================
# Start Comment Dashboard (Next.js) - Port 3500
# ============================================
echo -e "${GREEN}Starting Comment Dashboard (Next.js) on port 3500...${NC}"
cd /app/comment-dashboard

# Check if production build exists
if [ ! -f ".next/standalone/server.js" ] && [ ! -d ".next" ]; then
    echo -e "${YELLOW}No production build found. Building Next.js app...${NC}"
    npm run build 2>&1 || echo "⚠️  Build failed, trying development mode..."
fi

export PORT=3500
export NEXT_PUBLIC_API_URL=http://localhost:3500
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export MONGODB_URI=$MONGODB_URI
export DATABASE_URL=$DATABASE_URL
export MEGALLM_API_KEY=$MEGALLM_API_KEY
export MEGALLM_BASE_URL=$MEGALLM_BASE_URL
export MEGALLM_MODEL_CONTENT=$MEGALLM_MODEL_CONTENT
export MEGALLM_MODEL_FAST=$MEGALLM_MODEL_FAST
export MEGALLM_MODEL_ANALYSIS=$MEGALLM_MODEL_ANALYSIS
export SERPER_API_KEY=$SERPER_API_KEY
export FIRECRAWL_API_KEY=$FIRECRAWL_API_KEY
export TWITTERAPI_IO_KEY=$TWITTERAPI_IO_KEY
export DEVTO_API_KEY=$DEVTO_API_KEY
export DEVTO_USERNAME=$DEVTO_USERNAME
export DEVTO_PUBLISH_IMMEDIATELY=$DEVTO_PUBLISH_IMMEDIATELY
export DEVTO_DEFAULT_TAGS=$DEVTO_DEFAULT_TAGS
export UNIFIED_ASSISTANT_USER=$UNIFIED_ASSISTANT_USER
export UNIFIED_ASSISTANT_PASSWORD=$UNIFIED_ASSISTANT_PASSWORD
export GOOGLE_SERVICE_ACCOUNT_JSON=$GOOGLE_SERVICE_ACCOUNT_JSON
export GSC_SITE_URL=$GSC_SITE_URL
export CRON_SECRET=$CRON_SECRET
export PIPELINE_ENABLED=$PIPELINE_ENABLED
export PIPELINE_DRY_RUN=$PIPELINE_DRY_RUN

# Create data directory if it doesn't exist
mkdir -p data

# Start Next.js in background
RC_PATH=$RC_PATH:$RC_PATH
if [ -f ".next/standalone/server.js" ]; then
    # Production standalone server
    nohup node .next/standalone/server.js > /var/log/comment-dashboard.log 2>&1 &
elif [ -d ".next" ]; then
    # Production server with cache
    nohup npx next start -p 3500 > /var/log/comment-dashboard.log 2>&1 &
else
    # Development mode - try to run assistant:unified
    echo "⚠️  Production build not found, attempting dev mode..."
    nohup npm run assistant:unified > /var/log/comment-dashboard.log 2>&1 &
fi

Comment_PID=$!
echo "Comment Dashboard started (PID: $Comment_PID)"

# ============================================
# Wait for backends to be ready
# ============================================
echo ""
echo "Waiting for backend services to be ready..."
sleep 10

# Check Blog Dashboard
for i in 1 2 3 4 5 6 7 8 9 10; do
    if curl -s http://localhost:5000/ > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Blog Dashboard is ready${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}✗ Blog Dashboard failed to start${NC}"
        echo "Check logs: tail -f /var/log/blog-dashboard.log"
        cleanup
        exit 1
    fi
    echo "Waiting for Blog Dashboard... ($i/10)"
    sleep 3
done

# Check Comment Dashboard
for i in 1 2 3 4 5 6 7 8 9 10; do
    if curl -s http://localhost:3500/ > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Comment Dashboard is ready${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}✗ Comment Dashboard failed to start${NC}"
        echo "Check logs: tail -f /var/log/comment-dashboard.log"
        cleanup
        exit 1
    fi
    echo "Waiting for Comment Dashboard... ($i/10)"
    sleep 3
done

# Start Express Gateway (Port 8080)
echo ""
echo -e "${GREEN}Starting Gateway (Express) on port 8080...${NC}"
cd /app

export PORT=8080
export BLOG_DASHBOARD_URL=http://localhost:5000
export COMMENT_DASHBOARD_URL=http://localhost:3500

nohup node server.js > /var/log/unified-gateway.log 2>&1 &

Gateway_PID=$!
echo "Gateway started (PID: $Gateway_PID)"

# Wait for Gateway to start
sleep 5

# Check Gateway
for i in 1 2 3 4 5; do
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Gateway is ready${NC}"
        break
    fi
    if [ $i -eq 5 ]; then
        echo -e "${RED}✗ Gateway failed to start${NC}"
        echo "Check logs: tail -f /var/log/unified-gateway.log"
        cleanup
        exit 1
    fi
    echo "Waiting for Gateway... ($i/5)"
    sleep 2
done

echo ""
echo "============================================"
echo -e "${GREEN}  All Services Running!${NC}"
echo "============================================"
echo ""
echo "  Gateway:      http://localhost:8080"
echo "  Blog:         http://localhost:8080/blog"
echo "  Comments:     http://localhost:8080/comments"
echo "  Health Check: http://localhost:8080/health"
echo ""
echo "  Docker/Container Logs:"
echo "    tail -f /var/log/unified-gateway.log"
echo "    tail -f /var/log/blog-dashboard.log"
echo "    tail -f /var/log/comment-dashboard.log"
echo ""
echo "  Services:"
echo "    Blog:     PID $Blog_PID"
echo "    Comments: PID $Comment_PID"
echo "    Gateway:  PID $Gateway_PID"
echo ""
echo "============================================"
echo ""

wait -n $Gateway_PID $Blog_PID $Comment_PID

# If we get here, something died - cleanup and exit
echo "A service has stopped. Shutting down..."
cleanup
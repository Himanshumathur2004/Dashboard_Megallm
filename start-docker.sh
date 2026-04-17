#!/bin/sh
# Docker-compatible startup script for unified dashboard

set -e

echo "============================================"
echo "  Unified Dashboard - Docker Startup"
echo "============================================"
echo ""

# Set environment variables
export FLASK_APP=blog_platform.app:app
export FLASK_ENV=production
export PYTHONUNBUFFERED=1
export FLASK_DEBUG=0
export NODE_ENV=production
export PORT=8080
export NEXT_PUBLIC_API_URL=http://localhost:3500
export NEXT_TELEMETRY_DISABLED=1
export PYTHONPATH=/app:/opt/venv/bin

# Create log directory
mkdir -p /var/log

# Function to kill all background processes
cleanup() {
    echo "Stopping all services..."
    pkill -f "gunicorn" 2>/dev/null || true
    pkill -f "node" 2>/dev/null || true
    pkill -f "next start" 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# ============================================
# Start Blog Dashboard (Flask) - Port 5000
# ============================================
echo "Starting Blog Dashboard (Flask) on port 5000..."
cd /app/blog_generation_pipeline

# Check if venv exists
if [ ! -d "/opt/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv /opt/venv
fi

# Activate venv
export PATH="/opt/venv/bin:$PATH"

# Check if Flask app can be imported
echo "Testing Flask app..."
python -c "from blog_platform.app import app; print('Flask app loaded successfully')" 2>&1 | head -5

# Start Flask in background
nohup /opt/venv/bin/gunicorn \
    --bind 0.0.0.0:5000 \
    --workers 4 \
    --timeout 120 \
    --access-logfile /var/log/blog-dashboard.log \
    --error-logfile /var/log/blog-dashboard-error.log \
    blog_platform.app:app > /dev/null 2>&1 &

sleep 3

# ============================================
# Start Comment Dashboard (Next.js) - Port 3500
# ============================================
echo "Starting Comment Dashboard (Next.js) on port 3500..."
cd /app/comment-dashboard
export PORT=3500

# Start Next.js in background
if [ -f ".next/standalone/server.js" ]; then
    # Production standalone server
    nohup npm run assistant:unified > /var/log/comment-dashboard.log 2>&1 &
else
    # Production server
    nohup npm run assistant:unified > /var/log/comment-dashboard.log 2>&1 &
fi

sleep 3

# ============================================
# Start Express Gateway (Port 8080)
# ============================================
echo "Starting Gateway (Express) on port 8080..."
cd /app
export PORT=8080

# Check if server.js exists
if [ ! -f "server.js" ]; then
    echo "ERROR: server.js not found!"
    exit 1
fi

# Start Gateway
nohup node server.js > /var/log/unified-gateway.log 2>&1 &

sleep 5

echo ""
echo "============================================"
echo "  Services Started Successfully!"
echo "============================================"
echo ""
echo "Port mapping:"
echo "  Gateway:    http://localhost:8080"
echo "  Blog:       http://localhost:5000"
echo "  Comments:   http://localhost:3500"
echo ""
echo "Logs:"
echo "  Docker:     docker logs -f unified-dashboard"
echo "  Gateway:    tail -f /var/log/unified-gateway.log"
echo "  Blog:       tail -f /var/log/blog-dashboard.log"
echo "  Comments:   tail -f /var/log/comment-dashboard.log"
echo ""
echo "Waiting for all services to be healthy..."
echo ""

# Wait for all services to be ready
MAX_RETRIES=30
RETRY_INTERVAL=2

for retry in $(seq 1 $MAX_RETRIES); do
    BLOG_READY=$(curl -s http://localhost:5000/health >/dev/null 2>&1 && echo "true" || echo "false")
    COMMENT_READY=$(curl -s http://localhost:3500/ >/dev/null 2>&1 && echo "true" || echo "false")
    GATEWAY_READY=$(curl -s http://localhost:8080/health >/dev/null 2>&1 && echo "true" || echo "false")

    echo -n "$retry/$MAX_RETRIES - Blog: $BLOG_READY  Comments: $COMMENT_READY  Gateway: $GATEWAY_READY  "

    if [ "$BLOG_READY" = "true" ] && [ "$COMMENT_READY" = "true" ] && [ "$GATEWAY_READY" = "true" ]; then
        echo -e "\n✓ All services are ready!"
        echo ""
        echo "============================================"
        echo "  Dashboard URL: http://localhost:8080"
        echo "============================================"
        echo ""
        break
    fi

    sleep $RETRY_INTERVAL
done

if [ $retry -eq $MAX_RETRIES ]; then
    echo -e "\n✗ Some services failed to start!"
    echo "Check logs above for details."
    echo ""
    cleanup
    exit 1
fi

# Keep container running and wait for signals
wait
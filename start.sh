#!/bin/sh
set -e

echo "============================================"
echo "  Unified Dashboard - Starting All Services"
echo "============================================"

# Function to handle shutdown gracefully
cleanup() {
    echo "Stopping all services..."
    kill $FLASK_PID $NEXT_PID $EXPRESS_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# ============================================
# Start Flask Blog Dashboard (Port 5000)
# ============================================
echo ""
echo "Starting Blog Dashboard (Flask) on port 5000..."
cd /app/blog_generation_pipeline

export FLASK_APP=blog_platform.app:app
export FLASK_ENV=production
export PYTHONUNBUFFERED=1

python3 -c "from blog_platform.app import app; app.run(host='0.0.0.0', port=5000)" &
FLASK_PID=$!
echo "Blog Dashboard started (PID: $FLASK_PID)"

# ============================================
# Start Next.js Comment Dashboard (Port 3500)
# ============================================
echo ""
echo "Starting Comment Dashboard (Next.js) on port 3500..."
cd /app/NewComemnt-feature-x-assistant
PORT=3500 npm start &
NEXT_PID=$!
echo "Comment Dashboard started (PID: $NEXT_PID)"

# ============================================
# Wait for backends to be ready
# ============================================
echo ""
echo "Waiting for backend services to be ready..."
sleep 8

# Check Flask
for i in 1 2 3 4 5; do
    if wget -q --spider http://localhost:5000/ 2>/dev/null; then
        echo "✓ Blog Dashboard is ready"
        break
    fi
    echo "Waiting for Blog Dashboard... ($i/5)"
    sleep 3
done

# Check Next.js
for i in 1 2 3 4 5; do
    if wget -q --spider http://localhost:3500/comments 2>/dev/null; then
        echo "✓ Comment Dashboard is ready"
        break
    fi
    echo "Waiting for Comment Dashboard... ($i/5)"
    sleep 3
done

# ============================================
# Start Express Gateway (Port 8080)
# ============================================
echo ""
echo "Starting Gateway (Express) on port 8080..."
cd /app
node server.js &
EXPRESS_PID=$!
echo "Gateway started (PID: $EXPRESS_PID)"

echo ""
echo "============================================"
echo "  All Services Running!"
echo "============================================"
echo ""
echo "  Gateway:      http://localhost:8080"
echo "  Blog:         http://localhost:8080/blog"
echo "  Comments:     http://localhost:8080/comments"
echo "  Health:       http://localhost:8080/health"
echo ""
echo "============================================"

# Wait for any process to exit
wait -n $FLASK_PID $NEXT_PID $EXPRESS_PID

# If we get here, something died - cleanup and exit
echo "A service has stopped. Shutting down..."
cleanup
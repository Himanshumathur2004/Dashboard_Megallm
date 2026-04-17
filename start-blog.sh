#!/bin/sh
# Wrapper script for Flask blog dashboard

cd /app/blog_generation_pipeline

# Export environment variables
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

# Ensure the blog_platform is in the path
export PYTHONPATH=/app

# First, test if Flask app can be imported
python -c "from blog_platform.app import app; print('Flask app loaded successfully')" 2>&1

# Start Flask app with gunicorn
exec gunicorn --bind 0.0.0.0:5000 \
    --workers 4 \
    --timeout 900 \
    --access-logfile - \
    --error-logfile - \
    blog_platform.app:app 2>&1
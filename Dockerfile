# Combined Docker image for Unified Dashboard
# Runs: Blog Generator (Flask), Comment Generator (Next.js), and Gateway (Express)

FROM node:20-alpine

# Install Python and dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    build-base \
    libffi-dev \
    wget \
    && ln -sf python3 /usr/bin/python

WORKDIR /app

# ============================================
# 1. Setup Gateway (Express)
# ============================================
COPY package*.json ./
RUN npm install --production

# ============================================
# 2. Setup Blog Dashboard (Flask)
# ============================================
COPY blog_generation_pipeline/requirements.txt ./blog_requirements.txt
RUN pip3 install --no-cache-dir -r blog_requirements.txt --break-system-packages && rm blog_requirements.txt

# ============================================
# 3. Setup Comment Dashboard (Next.js)
# ============================================
WORKDIR /app/NewComemnt-feature-x-assistant
COPY NewComemnt-feature-x-assistant/package*.json ./
RUN npm install
COPY NewComemnt-feature-x-assistant ./
WORKDIR /app

# ============================================
# Copy all application files
# ============================================
# Gateway files
COPY public ./public
COPY server.js ./

# Blog dashboard files
COPY blog_generation_pipeline ./blog_generation_pipeline

# Comment dashboard files
# (already copied during setup above)

# ============================================
# Build Next.js app
# ============================================
# (built during setup above)

# ============================================
# Copy startup script
# ============================================
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# ============================================
# Environment variables
# ============================================
ENV NODE_ENV=production
ENV PORT=8080

# Expose the gateway port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start all services
CMD ["./start.sh"]
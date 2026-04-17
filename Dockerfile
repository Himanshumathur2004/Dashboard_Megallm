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
    curl \
    && ln -sf python3 /usr/bin/python

WORKDIR /app

# ============================================
# Setup Blog Dashboard (Flask) - Copy first, install after
# ============================================
COPY blog_generation_pipeline/requirements.txt ./

# Create Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Flask requirements
RUN pip3 install -r requirements.txt

# Copy blog platform app
COPY blog_generation_pipeline ./

WORKDIR /app/blog_generation_pipeline

# ============================================
# 1. Setup Gateway (Express)
# ============================================
WORKDIR /app
COPY package*.json ./
RUN npm install --production

# ============================================
# 2. Setup Comment Dashboard (Next.js)
# ============================================
WORKDIR /app/comment-dashboard

# Copy comment dashboard package files
COPY NewComemnt-feature-x-assistant/NewComemnt-feature-x-assistant/package*.json ./
RUN npm install

# Copy source code
COPY NewComemnt-feature-x-assistant/NewComemnt-feature-x-assistant/src ./src
COPY NewComemnt-feature-x-assistant/NewComemnt-feature-x-assistant/scripts ./scripts
COPY NewComemnt-feature-x-assistant/NewComemnt-feature-x-assistant/tools ./tools
COPY NewComemnt-feature-x-assistant/NewComemnt-feature-x-assistant/tsconfig.json ./tsconfig.json
COPY NewComemnt-feature-x-assistant/NewComemnt-feature-x-assistant/next-env.d.ts ./next-env.d.ts
COPY NewComemnt-feature-x-assistant/NewComemnt-feature-x-assistant/postcss.config.mjs ./postcss.config.mjs
COPY NewComemnt-feature-x-assistant/NewComemnt-feature-x-assistant/next.config.ts ./next.config.ts
COPY NewComemnt-feature-x-assistant/NewComemnt-feature-x-assistant/README.md ./README.md

# ============================================
# Copy all application files (root level)
# ============================================
COPY public /app/public
COPY server.js /app/server.js

# ============================================
# Build Next.js app in standalone mode
# ============================================
RUN echo "Installing dependencies..." && \
    npm install && \
    echo "Building Next.js app..." && \
    npm run build

# Prepare standalone output
RUN mkdir -p /app/standalone/.next && \
    cp -r .next/standalone/* /app/standalone/ && \
    cp -r .next/static /app/standalone/.next/static

# Finalize work directory
WORKDIR /app

# ============================================
# Copy startup script
# ============================================
COPY start-docker.sh ./start-docker.sh
RUN chmod +x ./start-docker.sh && \
    mkdir -p /var/log

# ============================================
# Environment variables
# ============================================
ENV NODE_ENV=production
ENV PORT=8080

# Expose ports for different services
EXPOSE 5000 3500 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start all services (exec for proper signal handling)
CMD ["./start-docker.sh"]
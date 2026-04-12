# Unified Dashboard

A unified entry point for the blog and comment generation dashboards. All three services run in a single Docker container for easy deployment.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker installed
- Docker Compose installed

### Run with Docker Compose

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Access the dashboard at: **http://localhost:8080**

### Run with Docker (manual)

```bash
# Build the image
docker build -t unified-dashboard .

# Run the container
docker run -d \
  -p 8080:8080 \
  -e MONGODB_URI="your-mongodb-connection-string" \
  -e MEGALLM_API_KEY="your-api-key" \
  --name unified-dashboard \
  unified-dashboard
```

## 🏃‍♂️ Local Development (without Docker)

### Prerequisites
- Node.js 20+
- Python 3.10+
- MongoDB Atlas account

### Start all services manually

```bash
# Terminal 1: Start Blog Dashboard (Flask)
cd blog_generation_pipeline
python3 -m flask run --port=5000

# Terminal 2: Start Comment Dashboard (Next.js)
cd NewComemnt-feature-x-assistant
npm run assistant:unified

# Terminal 3: Start Gateway (Express)
npm start
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with two buttons |
| `/blog` | Proxied to Blog Dashboard (Flask app) |
| `/comments` | Proxied to Comment Dashboard (Next.js app) |
| `/health` | Health check endpoint |

## ⚙️ Environment Variables

Create a `.env` file or pass these to Docker:

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# MegaLLM API
MEGALLM_API_KEY=your-api-key
MEGALLM_BASE_URL=https://beta.megallm.io/v1

# Server (optional)
PORT=8080
```

## ☁️ Production Deployment

### Deploy to any Docker-compatible platform:

1. **Push to GitHub** (include Dockerfile)
2. **Deploy to:**
   - **Render:** Create new Web Service → Docker
   - **Railway:** Connect repo → auto-detect Dockerfile
   - **Fly.io:** `fly launch`
   - **VPS:** `docker-compose up -d`

### One-command deploy to Fly.io:

```bash
fly launch
fly deploy
```

## Architecture

```
┌──────────────────────────────────────────┐
│         Docker Container                 │
│  ┌────────────────────────────────────┐  │
│  │     Express Gateway (:8080)        │  │
│  │     - Routes / to landing page     │  │
│  │     - Proxies /blog to Flask       │  │
│  │     - Proxies /comments to Next.js │  │
│  └────────────────────────────────────┘  │
│              │                            │
│  ┌───────────┴───────────┐               │
│  │                       │               │
│  ▼                       ▼               │
│ ┌──────────────┐  ┌──────────────┐       │
│ │ Flask Blog   │  │ Next.js      │       │
│ │ Dashboard    │  │ Comments     │       │
│ │ (:5000)      │  │ Dashboard    │       │
│ │              │  │ (:3500)      │       │
│ └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────┘
```

All services run internally within a single container. The gateway exposes port 8080 to the outside world.

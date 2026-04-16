# Manual Startup Instructions

## Quick Start (3 Terminals)

### Terminal 1: Blog Dashboard (Flask on port 5000)
```bash
cd blog_generation_pipeline
python3 -m flask run --host=0.0.0.0 --port=5000 --debug
```

### Terminal 2: Comment Dashboard (Next.js on port 3500)
```bash
cd NewComemnt-feature-x-assistant
npm run assistant:unified
```

### Terminal 3: Gateway (Express on port 8080)
```bash
node server.js
```

## Access the Dashboard
Open browser to: http://localhost:8080

## Routes
- `/` - Landing page
- `/blog` - Blog Dashboard (proxied to Flask)
- `/comments` - Comment Dashboard (proxied to Next.js)
- `/health` - Health check

## Environment Variables (.env)
Required:
```
MONGODB_URI=mongodb+srv://...
MEGALLM_API_KEY=your-api-key
MEGALLM_BASE_URL=https://beta.megallm.io/v1
```

## One-time Setup
Prerequisites:
- Install Node.js 18+: https://nodejs.org/
- Install Python 3.10+: https://www.python.org/
- Install MongoDB Atlas account: https://www.mongodb.com/atlas
# Unified Dashboard - Project Documentation

## Project Overview

A unified gateway server that proxies requests to multiple backend dashboards:
- **Blog Dashboard** (Flask) - Port 5000
- **Comment Dashboard** (Express/Next.js) - Port 3500
- **Gateway** (Express) - Port 8080

## Architecture

```
                    ┌─────────────────────┐
                    │   Gateway (8080)    │
                    │     (Express)       │
                    └─────────┬───────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
    ┌───────────┐      ┌───────────┐      ┌───────────┐
    │  Public   │      │   Blog    │      │ Comments  │
    │  Static   │      │  (Flask)  │      │ (Next.js) │
    │   Files   │      │  (5000)   │      │  (3500)   │
    └───────────┘      └───────────┘      └───────────┘
```

## Routes

| Path | Target | Description |
|------|--------|-------------|
| `/` | Static | Landing page |
| `/health` | Gateway | Health check endpoint |
| `/blog/*` | Flask (5000) | Blog dashboard (path stripped) |
| `/comments/*` | Express (3500) | Comment dashboard (path stripped) |
| `/api/*` | Express (3500) | Direct API proxy (path preserved) |
| `/analytics` | Express (3500) | Analytics endpoint |
| `/login` | Redirect | → `/comments/login` |
| `/logout` | Redirect | → `/comments/logout` |

## Files Structure

```
E:\unified_dashboard\
├── server.js           # Gateway server (Express)
├── package.json        # Node dependencies
├── Dockerfile          # Multi-service container
├── start.sh            # Startup script for all services
├── public/
│   └── index.html      # Landing page
├── blog_generation_pipeline/  # Flask blog backend
└── NewComemnt-feature-x-assistant/
    └── tools/unified-assistant/  # Comment dashboard backend
```

## How to Run

### Local Development

```bash
# Terminal 1: Start Blog Dashboard (Flask)
cd blog_generation_pipeline
FLASK_APP=blog_platform.app:app python -m flask run --port=5000

# Terminal 2: Start Comment Dashboard
cd NewComemnt-feature-x-assistant
npm run assistant:unified

# Terminal 3: Start Gateway
node server.js
```

### Docker

```bash
docker build -t unified-dashboard .
docker run -p 8080:8080 unified-dashboard
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | Gateway port |
| `BLOG_DASHBOARD_URL` | http://localhost:5000 | Blog backend URL |
| `COMMENT_DASHBOARD_URL` | http://localhost:3500 | Comment backend URL |

## Key Technical Details

### 1. Path Rewriting for Comments

The comment dashboard is mounted at `/comments` but the backend expects root paths. The proxy rewrites:

```
/comments/login → /login
/comments/api/reddit/cache → /api/reddit/cache
```

```javascript
pathRewrite: { '^/comments': '' }
```

### 2. Redirect Location Rewriting

Backend authentication redirects (e.g., `/login`) are rewritten to include the `/comments` prefix:

```javascript
proxyRes: (proxyRes, req, res) => {
  const location = proxyRes.headers.location;
  if (location?.startsWith('/') && !location.startsWith('/comments')) {
    proxyRes.headers.location = '/comments' + location;
  }
}
```

### 3. API Path Preservation

The comment dashboard's frontend makes absolute API calls (`/api/*`). Express middleware strips the mount path, so we restore it:

```javascript
app.use('/api', (req, res, next) => {
  req.url = '/api' + req.url;  // Restore stripped prefix
  commentDirectProxy(req, res, next);
});
```

### 4. Session Cookie Handling

Sessions work across the proxy because:
- `changeOrigin: true` - Gateway hostname is used for cookies
- `sameSite: "lax"` in backend session config
- Cookies are set on the gateway domain

## Login Credentials

| Service | Username | Password |
|---------|----------|----------|
| Comments | admin@megallm.io | MegaLLM@SOCIAL |

## Issues Fixed

### Issue 1: Login Page Not Rendering Through Proxy
- **Problem**: Accessing `/comments/login` showed Next.js 404 error
- **Root Cause**: Backend session check redirected to `/login`, creating a loop
- **Solution**: 
  - Mounted dashboard under `/comments` prefix
  - Rewrote redirect locations in `proxyRes` handler
  - Added gateway-level redirects `/login` → `/comments/login`

### Issue 2: API Fetch Errors After Login
- **Problem**: Posts failed to fetch with API errors
- **Root Cause**: Express `app.use('/api', ...)` strips the `/api` prefix, so backend received `/reddit/cache` instead of `/api/reddit/cache`
- **Solution**: Wrapper middleware restores the prefix before proxying:
  ```javascript
  req.url = '/api' + req.url;
  ```

### Issue 3: EADDRINUSE Port Already in Use
- **Problem**: Port 8080 already in use
- **Solution**: Kill existing process:
  ```bash
  # Windows
  netstat -ano | findstr :8080
  taskkill //F //PID <pid>
  ```

## Health Check Endpoint

```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-14T...",
  "services": {
    "blog": "http://localhost:5000",
    "comments": "http://localhost:3500"
  }
}
```

## Debugging

Enable proxy logging by checking console output:
- `[COMMENT PROXY]` - Requests to comment dashboard
- `[COMMENT DIRECT PROXY]` - Direct API/analytics proxy
- Response status codes and rewritten redirects are logged

## Pending/In Progress

- [ ] Test complete fetch posts functionality through gateway
- [ ] Verify API calls work with authenticated session
- [ ] Deploy to production (Render)
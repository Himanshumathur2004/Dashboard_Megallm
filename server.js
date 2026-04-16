const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Backend service URLs
const BLOG_DASHBOARD_URL = process.env.BLOG_DASHBOARD_URL || 'http://localhost:5000';
const COMMENT_DASHBOARD_URL = process.env.COMMENT_DASHBOARD_URL || 'http://localhost:3500';

// Serve static files from public directory (landing page)
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      blog: BLOG_DASHBOARD_URL,
      comments: COMMENT_DASHBOARD_URL
    }
  });
});

// Proxy /blog, /blogs and any /blog(s)/* requests to Flask backend (port 5000)
const blogProxy = createProxyMiddleware({
  target: BLOG_DASHBOARD_URL,
  changeOrigin: true,
  ws: true,
  pathRewrite: { '^/blogs?': '' }
});

// Direct proxy for Blog Dashboard APIs (no path rewrite)
const blogDirectProxy = createProxyMiddleware({
  target: BLOG_DASHBOARD_URL,
  changeOrigin: true,
  ws: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log(`[BLOG DIRECT PROXY] ${req.method} ${req.originalUrl} -> ${BLOG_DASHBOARD_URL}${proxyReq.path}`);
    },
    proxyRes: (proxyRes, req, res) => {
      console.log(`[BLOG DIRECT PROXY] <- ${proxyRes.statusCode} ${req.url}`);
    }
  }
});

app.use(['/blog', '/blogs'], blogProxy);

// ─────────────────────────────────────────────────────────────
// Comment Dashboard proxy (Express on port 3500)
// All comment-dashboard routes are mounted under /comments
// so auth cookies share the gateway domain and the session
// stays valid when the backend redirects.
// ─────────────────────────────────────────────────────────────

const commentProxy = createProxyMiddleware({
  target: COMMENT_DASHBOARD_URL,
  changeOrigin: true,
  ws: true,
  pathRewrite: { '^/comments': '' },
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log(`[COMMENT PROXY] ${req.method} ${req.url} -> ${COMMENT_DASHBOARD_URL}${proxyReq.path}`);
    },
    proxyRes: (proxyRes, req, res) => {
      // Rewrite redirect locations from backend paths to /comments prefixed paths
      const location = proxyRes.headers.location;
      if (location) {
        // Rewrite absolute redirects: /login -> /comments/login, / -> /comments/
        if (location.startsWith('/') && !location.startsWith('/comments')) {
          proxyRes.headers.location = '/comments' + location;
          console.log(`[COMMENT PROXY] Rewrote redirect: ${location} -> ${proxyRes.headers.location}`);
        }
      }
      console.log(`[COMMENT PROXY] <- ${proxyRes.statusCode} ${req.url}`);
    }
  }
});

// Proxy for /api and /analytics - paths pass through as-is to comment dashboard
// We use a router to preserve the full path (app.use strips the mount prefix)
const commentDirectProxy = createProxyMiddleware({
  target: COMMENT_DASHBOARD_URL,
  changeOrigin: true,
  ws: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log(`[COMMENT DIRECT PROXY] ${req.method} ${req.originalUrl} -> ${COMMENT_DASHBOARD_URL}${proxyReq.path}`);
    },
    proxyRes: (proxyRes, req, res) => {
      console.log(`[COMMENT DIRECT PROXY] <- ${proxyRes.statusCode} ${req.url}`);
    }
  }
});

// Route all /comments/* paths to the comment dashboard (strips /comments prefix)
app.use('/comments', commentProxy);
app.use('/comments/', commentProxy);

// The comment dashboard's frontend uses absolute paths for API calls (/api/*),
// analytics (/analytics), login, logout. Proxy these directly so the
// JavaScript in the dashboard pages works without modification.
//
// IMPORTANT: Comment Dashboard uses /api/{platform}/* pattern (e.g., /api/reddit/drafts)
// Blog Dashboard uses /api/accounts, /api/blogs, etc.
// We route platform-specific APIs to Comments, others to Blog.
const COMMENT_API_PLATFORMS = ['reddit', 'devto', 'hn', 'bluesky', 'x'];

app.use('/api', (req, res, next) => {
  // Check if this is a Comment Dashboard API (has platform prefix)
  // req.url has '/api' stripped by app.use, so we check the originalUrl
  const originalPath = req.originalUrl; // e.g., /api/accounts or /api/reddit/drafts
  const pathParts = originalPath.split('/').filter(Boolean);
  const apiPrefix = pathParts[0]; // 'api'
  const resource = pathParts[1]; // 'accounts', 'reddit', 'blogs', analytics, etc.

  // Restore the full /api prefix for all routes
  const fullPath = '/api' + req.url;
  req.url = fullPath;

  if (COMMENT_API_PLATFORMS.includes(resource)) {
    // Route to Comments Dashboard
    commentDirectProxy(req, res, next);
  } else if (resource === 'analytics') {
    // Blog analytics APIs go to Blog Dashboard (/api/analytics/global, /api/analytics/trends, etc.)
    blogDirectProxy(req, res, next);
  } else {
    // Everything else (/api/accounts, /api/blogs, etc.) goes to Blog Dashboard
    blogDirectProxy(req, res, next);
  }
});
app.use('/analytics', (req, res, next) => {
  req.url = '/analytics' + req.url;
  commentDirectProxy(req, res, next);
});

// Redirect bare /login and /logout to the comments sub-path
app.get('/login', (req, res) => res.redirect('/comments/login'));
app.get('/logout', (req, res) => res.redirect('/comments/logout'));
app.post('/login', (req, res) => res.redirect(307, '/comments/login'));

// Main route - landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
========================================================
  Unified Dashboard Gateway Running
========================================================

  Gateway:    http://localhost:${PORT}

  Routes:
  • /           → Landing Page
  • /blog/*     → Proxied to Blog Dashboard (${BLOG_DASHBOARD_URL})
  • /comments/* → Proxied to Comments (${COMMENT_DASHBOARD_URL})
  • /health     → Health Check

========================================================
  `);
});
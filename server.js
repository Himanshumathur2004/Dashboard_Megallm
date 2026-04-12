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

// Proxy /blog and all /blog/* requests to Flask backend (port 5000)
app.use('/blog', createProxyMiddleware({
  target: BLOG_DASHBOARD_URL,
  changeOrigin: true,
  ws: true,
  pathRewrite: { '^/blog': '' }
}));

// Proxy /comments and all /comments/* requests to Next.js backend (port 3500)
app.use('/comments', createProxyMiddleware({
  target: COMMENT_DASHBOARD_URL,
  changeOrigin: true,
  ws: true
}));

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
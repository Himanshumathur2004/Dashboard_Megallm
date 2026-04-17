# Unified Dashboard - Complete Project Architecture

## 📋 Executive Summary

This is a **unified content generation platform** combining three major services into a single application:

1. **Blog Generator** (Flask) - Automated blog post generation for multiple platforms
2. **Comment Assistant** (Next.js) - AI-powered comment generation for social media
3. **Gateway** (Express) - Unified entry point routing all requests

All services run within a single Docker container for streamlined deployment and management.

---

## 🎯 Project Overview

The Unified Dashboard provides a complete AI-powered content creation workflow:

- **Blog Dashboard**: Scrapes articles from RSS feeds → Generates SEO-optimized blogs → Manages posting
- **Comment Dashboard**: Analyzes trending content → Generates engagement comments → Auto-publishes to platforms
- **Unified Gateway**: Single domain entry point (`/blog`, `/comments`, `/`) with intelligent routing

---

## 📁 Complete Directory Structure

```
unified_dashboard/
│
├── unified-dashboard/                    # Main Gateway
│   ├── public/                           # Static landing page
│   │   └── index.html                    # Landing dashboard (tech-focused design)
│   ├── server.js                         # Express gateway with proxy routing
│   └── package.json                      # Gateway dependencies
│
├── blog_generation_pipeline/            # Blog Generation System
│   ├── blog_platform/                    # Flask backend
│   │   ├── app.py                        # Flask REST API server
│   │   ├── config.py                     # Configuration & API keys
│   │   ├── database.py                   # MongoDB abstraction layer
│   │   ├── blog_generator.py             # MegaLLM blog generation logic
│   │   ├── insight_scheduler.py          # Insight-driven generation
│   │   └── templates/                    # HTML templates
│   │       └── index.html                # Web dashboard
│   ├── scrape_to_mongo.py                # RSS feed scraper
│   ├── wf1.py                            # Content analysis (stub)
│   ├── workflow_common.py                # Shared utilities
│   ├── requirements.txt                  # Python dependencies
│   ├── .env.example                      # Environment template
│   └── README.md                         # Blog platform docs
│
├── NewComemnt-feature-x-assistant/       # Comment Assistant (Next.js)
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                  # Landing page
│   │   │   ├── admin/                    # Admin dashboard
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx              # Post queue management
│   │   │   │   └── queue/
│   │   │   │       └── page.tsx
│   │   │   ├── api/
│   │   │   │   ├── pipeline/             # Content pipeline (analyze, generate, improve, provide)
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── feedback.route.ts
│   │   │   │   │   ├── improve.route.ts
│   │   │   │   │   └── post.route.ts
│   │   │   └── layout.tsx
│   │   ├── content/blog/                 # Marketing blog posts
│   │   │   └── *.{mdx,blog/markdown}
│   │   ├── data/                         # Configuration data
│   │   │   ├── models.ts                 # LLM model configurations
│   │   │   ├── providers.ts              # LLM provider configurations
│   │   │   └── competitors.ts            # Competitive analysis
│   │   ├── lib/
│   │   │   ├── ai/
│   │   │   │   └── provider.ts           # LLM provider abstraction
│   │   │   ├── integrations/
│   │   │   │   ├── serper.ts             # Google Search API
│   │   │   │   ├── firecrawl.ts          # Web scraping
│   │   │   │   ├── twitterapi-io.ts      # X (Twitter) API
│   │   │   │   ├── gsc.ts                # Google Search Console API
│   │   │   │   └── analytics.ts          # Analytics integration
│   │   │   └── pipeline/                 # Content pipeline utilities
│   │   │       ├── types.ts              # Pipeline data types
│   │   │       ├── state.ts              # Pipeline state management
│   │   │       ├── strategy.ts           # Generation strategy
│   │   │       ├── distribution.ts       # Platform distribution
│   │   │       ├── humanizer.ts          # Text humanization
│   │   │       └── prompts.ts            # LLM prompts
│   │   ├── scripts/                      # Post-generation scripts
│   │   │   ├── run-pipeline.ts           # Main pipeline runner
│   │   │   ├── post-scheduler.ts         # Post queue scheduler
│   │   │   ├── post-queue.ts             # Post queue management
│   │   │   └── auth/
│   │   │       └── session-manager.ts    # Session management
│   │   ├── workflows/                    # Pipeline workflow definitions
│   │   │   ├── analyze.ts
│   │   │   ├── feedback.ts
│   │   │   ├── generate.ts
│   │   │   ├── improve.ts
│   │   │   └── post.ts
│   │   └── globals.css                   # Global styles
│   │
│   ├── tools/                           # Platform-specific assistants
│   │   ├── reddit-assistant/             # Reddit comment generator
│   │   │   ├── fetch-posts.js            # Scrape Reddit
│   │   │   ├── fetch-all-24h.js          # 24-hour fetch
│   │   │   ├── humanize.js               # Text humanizer
│   │   │   ├── load-env.js               # Environment loader
│   │   │   ├── paths.js                  # File paths
│   │   │   ├── analyze-comments.js       # Comment analysis
│   │   │   ├── draft-comments.js         # Comment draft generator
│   │   │   ├── server.js                 # Standalone server
│   │   │   ├── simulate-post.js          # Test posting
│   │   │   ├── queue-manager.js          # Queue management
│   │   │   ├── schedule.js               # Schedule posts
│   │   │   ├── fetch-articles.js         # Dev.to fetch
│   │   │   ├── post.js                   # Dev.to poster
│   │   │   ├── test-config.js            # Config tester
│   │   │   └── server.js                 # Devto assistant server
│   │   ├── devto-assistant/              # Dev.to comment generator
│   │   ├── hackernews-assistant/         # Hacker News comment generator
│   │   ├── bluesky-assistant/            # Bluesky comment generator
│   │   └── x-assistant/                  # X (Twitter) comment generator
│   │
│   ├── docs/                            # Documentation
│   │   ├── README.md                     # Main doc index
│   │   ├── assistants.md                 # All assistants docs
│   │   └── devto-automation.md           # Dev.to automation
│   │
│   ├── package.json                      # Next.js dependencies
│   ├── tsconfig.json                     # TypeScript config
│   ├── next.config.ts                    # Next.js config
│   ├── postcss.config.mjs                # Tailwind config
│   ├── vercel.json                       # Vercel deployment config
│   └── README.md                         # Comment assistant docs
│
├── Dockerfile                            # Multi-service Docker image
├── docker-compose.yml                    # Docker Compose configuration
├── nginx.conf                            # Nginx reverse proxy config
├── start.sh                              # Unified service startup script
├── start-blog.sh                         # Blog dashboard startup
├── deploy-vps.sh                         # VPS deployment automation
├── deploy-vps-comment.sh                 # Comment dashboard deployment
├── .env.example                          # Example environment variables
├── requirements.txt                      # Python dependencies
├── README.md                             # Top-level documentation
├── DEPLOYMENT-GUIDE.md                   # Deployment guide
├── QUICK-DEPLOY.md                       # Quick deployment reference
├── PLAN.md                               # Implementation plan
└── FALLBACK-SYSTEM.md                    # Fallback system documentation
```

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  User Browser                                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/SSL
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Nginx (Port 443) - SSL Termination              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Express Gateway (Port 8080)                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  '/' → Landing page (index.html)                      │    │
│  │  '/blog' → Proxied to Flask (:5000)                   │    │
│  │  '/comments' → Proxied to Next.js (:3500)             │    │
│  │  '/health' → Health check endpoint                    │    │
│  └─────────────────────────────────────────────────────┘    │
└──┬────────────────────────┬────────────────────────────────┘
   │                        │
   │                        │
   ▼                        ▼
┌───────────────┐    ┌───────────────┐
│ Flask Blog    │    │ Next.js       │
│ Dashboard     │    │ Comments      │
│ (:5000)       │    │ Dashboard     │
│               │    │ (:3500)       │
│ • RSS Scraper │    │ • Content    │
│ • Blog Gen    │    │   Pipeline   │
│ • Posting     │    │ • Comment   │
│ • Dashboard   │    │   Assistants │
└───────────────┘    │ • Admin UI   │
                     └───────────────┘
```

### Internal Flow

**Blog Dashboard Flow:**
```
1. User clicks "Generate Blogs" on landing page
2. GET /blog → Gateway → Flask (port 5000)
3. Flask dashboard loads and shows accounts
4. User selects account and clicks "Generate"
5. Flask calls MegaLLM API → BlogGenerator
6. Blog post saved to MongoDB
7. User sees blog details, can mark as posted
```

**Comment Assistant Flow:**
```
1. User navigates to /comments
2. Next.js dashboard loads with trending content
3. User selects platform (Reddit, Dev.to, etc.)
4. System scrapes content using Serper/Firecrawl
5. LLM generates engagement comment
6. Humanizer processes text
7. Comment saved to queue
8. Optional: Auto-post or manual post
```

---

## 🧩 Component Details

### 1. Express Gateway ([server.js](server.js))

**Purpose:** Single entry point with intelligent routing

**Key Features:**
- Static file serving for landing page
- Reverse proxy to Flask Blog Dashboard
- Reverse proxy to Next.js Comment Dashboard
- API path routing based on resource type
- WebSocket support for real-time features
- Redirect handling for authentication flows

**Routing Logic:**
```javascript
/ → Landing Page
/blog/* → Flask Dashboard
/comments/* → Comment Dashboard
/api/accounts → Blog Dashboard API
/api/reddit/drafts → Comment Dashboard API
/api/analytics → Blog Analytics
/login → /comments/login
/logout → /comments/logout
/health → Health check
```

### 2. Blog Dashboard ([blog_generation_pipeline](blog_generation_pipeline/))

**Purpose:** Automated blog generation and management

**Dependencies:**
- Flask 3.0+
- Flask-CORS 4.0+
- PyMongo 4.6+
- Python-dotenv 1.0+
- Requests 2.31+
- Gunicorn 21.2+

**Key Routes:**
```
GET  /                      → Dashboard landing
GET  /api/accounts          → List all accounts
GET  /api/blogs             → List blogs (filter by account_id)
GET  /api/blogs/:id         → Get blog details
POST /api/blogs/generate    → Generate new blog posts
PUT  /api/blogs/:id/mark-posted → Mark as published
DELETE /api/blogs/:id       → Delete draft blog
GET  /api/dashboard/:id     → Dashboard stats
GET  /api/generation-history/:id → Generation history
```

**Database Schema:**
```javascript
// accounts
{
  account_id: "account_1",
  name: "ShipAIFast",
  description: "Main content account",
  topics: ["cost_optimization", "performance", "reliability", "infrastructure"]
}

// blogs
{
  _id: ObjectId,
  account_id: "account_1",
  title: "Blog post title",
  body: "Full blog content",
  topic: "cost_optimization",
  status: "draft|posted",
  created_at: ISODate,
  posted_at: ISODate|null
}
```

### 3. Comment Assistant ([NewComemnt-feature-x-assistant](NewComemnt-feature-x-assistant/))

**Purpose:** AI-powered comment generation for social platforms

**Tech Stack:**
- Next.js 16.2.1
- React 19.2.4
- TypeScript 6.0.2
- Tailwind CSS 4.2.2
- Express 5.1.0 (for refresh button API)
- MDX for blog content

**Key Dependencies:**
```
@ai-sdk/openai: LLM integration
@mendable/firecrawl-js: Web scraping
ai: AI SDK
googleapis: Google Services
express-session: Session management
zod: Schema validation
next-mdx-remote: MDX rendering
```

**Pipeline Workflows:**
```typescript
// analyze - Analyze trending content
// generate - Generate content draft
// improve - Refine content based on feedback
// post - Post to platform (or queue)
// feedback - Collect feedback for improvement loop
```

**Posters:**
- `reddit-assistant.js` - Reddit comment generation
- `devto-assistant.js` - Dev.to comment generation
- `hackernews-assistant.js` - Hacker News replies
- `bluesky-assistant.js` - Bluesky comment generation
- `x-assistant.js` - X (Twitter) tweet generation

**API Endpoints:**
```typescript
POST /api/pipeline/generate    → Generate new content
POST /api/pipeline/improve     → Improve existing content
POST /api/pipeline/analyze     → Analyze content
POST /api/pipeline/feedback    → Log feedback
POST /api/pipeline/post        → Post content manually
GET  /api/reddit/drafts        → Reddit drafts
GET  /api/devto/drafts         → Dev.to drafts
// ... and more for each platform
```

---

## 🔑 Environment Variables

### Core Required Variables

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/megallm_blog_platform
DATABASE_URL=${MONGODB_URI}

# MegaLLM API (for LLM generation)
MEGALLM_API_KEY=sk-mega-your-key-here
MEGALLM_BASE_URL=https://beta.megallm.io/v1
MEGALLM_MODEL_CONTENT=claude-opus-4-6      # For long-form content
MEGALLM_MODEL_FAST=claude-sonnet-4-5        # For quick drafts
MEGALLM_MODEL_ANALYSIS=claude-opus-4-6      # For analysis tasks

# Serper API (Google Search)
SERPER_API_KEY=your-serper-api-key

# Firecrawl API (Web Scraper)
FIRECRAWL_API_KEY=your-firecrawl-api-key

# Session Authentication
UNIFIED_ASSISTANT_USER=your-email@megallm.io
UNIFIED_ASSISTANT_PASSWORD=your-password
```

### Optional Platform Variables

```bash
# X (Twitter)
TWITTERAPI_IO_KEY=your-twitter-key

# Dev.to
DEVTO_API_KEY=your-devto-key
DEVTO_USERNAME=your-username
DEVTO_PUBLISH_IMMEDIATELY=false
DEVTO_DEFAULT_TAGS=technology,ai,development

# Google Search Console
GOOGLE_SERVICE_ACCOUNT_JSON=<base64-json-config>
GSC_SITE_URL=https://yourdomain.com
```

### Pipeline Variables

```bash
PIPELINE_ENABLED=false        # Enable auto-generation pipeline
PIPELINE_DRY_RUN=true         # Don't actually post (testing)
CRON_SECRET=your-random-secret
```

---

## 🐳 Docker Configuration

### Dockerfile Structure

**Layered approach:**
1. Base: `node:20-alpine` with Python
2. Install Python dependencies
3. Create virtual environment
4. Copy blog platform files
5. Copy gateway files
6. Build Next.js app in standalone mode
7. Prepare standalone output

**Multi-stage considerations:**
- Virtual environment at `/opt/venv`
- Next.js build output at `/app/comment-dashboard/.next`
- Standalone server at `/app/standalone`

### docker-compose.yml

**Services:**
- `unified-dashboard`: Main container
  - Ports: 8080 (Gateway), 5000 (Blog), 3500 (Comments)
  - All environment variables exposed
  - Shared network: `unified-dashboard-network`
  - Shared volumes for logs

**Volumes:**
- `unified-dashboard-logs`: Persistent logs in `/var/log`

---

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended for Production)

```bash
# Build and deploy
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Build fresh
docker-compose build --no-cache
docker-compose up -d
```

**Pros:**
- Single deployment
- Easy scaling
- Consistent environments
- Built-in health checks

### Option 2: Docker (Manual)

```bash
# Build
docker build -t unified-dashboard .

# Run
docker run -d \
  -p 8080:8080 \
  -p 5000:5000 \
  -p 3500:3500 \
  -e MONGODB_URI="your-uri" \
  -e MEGALLM_API_KEY="your-key" \
  --name unified-dashboard \
  unified-dashboard
```

### Option 3: VPS with Systemd (Traditional)

1. Upload files to `/opt/`
2. Run deployment scripts
3. Configure Nginx reverse proxy
4. Setup SSL certificates
5. Create systemd services

**See:** [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for details

---

## 📊 Data Flow Diagrams

### Blog Generation Pipeline

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐
│   RSS    │────▶│  MongoDB    │────▶│  Flask       │
│  Feeds   │     │   Storage   │     │  Dashboard   │
└──────────┘     └─────────────┘     └──────────────┘
                                                │
                                                ▼
                                            ┌─────────┐
                                            │MegaLLM  │
                                            │API      │
                                            └─────────┘
                                                │
                                                ▼
                                          Blog Post
                                             │
                                             ▼
                                      MongoDB: blogs
                                             │
                                             ▼
                                    Flask Dashboard
```

### Comment Pipeline

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐
│ Platforms│────▶│ Platform    │     │ Next.js      │
│ (Reddit, │     │ Assistants  │     │ Comment UI   │
│  Dev.to) │     │ (Node.js)   │     │              │
└──────────┘     └─────────────┘     └──────────────┘
                                                │
                                                ▼
                                            ┌─────────┐
                                            │ MLLM    │
                                            │ API     │
                                            └─────────┘
                                                │
                                                ▼
                                          Draft Comment
                                             │
                                             ▼
                                      MongoDB: queue
                                             │
                                             ▼
                                    User Review → Post
```

---

## 🔧 Configuration Examples

### Blog Dashboard Config ([blog_generation_pipeline/blog_platform/config.py](blog_generation_pipeline/blog_platform/config.py))

```python
class Config:
    # Database
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    MONGODB_DB = os.getenv('MONGODB_DB', 'megallm_blog_platform')

    # MegaLLM API
    MEGALLM_API_KEY = os.getenv('MEGALLM_API_KEY')
    MEGALLM_BASE_URL = os.getenv('MEGALLM_BASE_URL', 'https://beta.megallm.io/v1')
    MODEL = os.getenv('MODEL', 'claude-opus-4-6')

    # Serper Google Search
    SERPER_API_KEY = os.getenv('SERPER_API_KEY')

    # Firecrawl Web Scraper
    FIRECRAWL_API_KEY = os.getenv('FIRECRAWL_API_KEY')
```

### Comment Dashboard Config (`.env`)

```env
# Database
MONGODB_URI=mongodb+srv://...
DATABASE_URL=${MONGODB_URI}

# LLM Models
MEGALLM_API_KEY=sk-mega-xxx
MEGALLM_BASE_URL=https://beta.megallm.io/v1
MEGALLM_MODEL_CONTENT=claude-opus-4-6
MEGALLM_MODEL_FAST=claude-sonnet-4-5
MEGALLM_MODEL_ANALYSIS=claude-opus-4-6

# Session
UNIFIED_ASSISTANT_USER=your-email@megallm.io
UNIFIED_ASSISTANT_PASSWORD=your-password

# Platform APIs
SERPER_API_KEY=your-key
FIRECRAWL_API_KEY=your-key
TWITTERAPI_IO_KEY=your-key
DEVTO_API_KEY=your-key
```

---

## 📈 Key Features

### Blog Dashboard Features

1. **Automated RSS Scraping** - Fetches articles from multiple sources
2. **AI-Powered Generation** - MegaLLM createsSEO-optimized blogs
3. **Account Management** - Multiple content accounts with distinct topics
4. **Status Tracking** - Track drafts vs. posted content
5. **Web Dashboard** - Modern UI for managing blog generation

**Topics:**
- Cost Optimization
- Performance & Speed
- Reliability & Uptime
- Infrastructure & Compliance

**Platforms:** Medium, Quora, Dev.to, Tumblr, Blogger, Ghost

### Comment Assistant Features

1. **Platform Selection** - Reddit, Dev.to, Hacker News, X, LinkedIn
2. **Trending Content Analysis** - Use Serper to find hot topics
3. **AI Comment Generation** - MegaLLM creates engaging comments
4. **Humanization** - Text processing to sound natural
5. **Dequeuing System** - Manage comment queue
6. **Auto-Posting** - Scheduled or manual posting
7. **Admin Dashboard** - View queue, manage drafts
8. **Feedback Loop** - Learn from user feedback to improve

### Unified Features

1. **Single Domain** - All services accessible from one URL
2. **Tenant Isolation** - Each account has its own space
3. **Security** - Session management and auth
4. **Logging** - Comprehensive logging across all services
5. **Health Checks** - Built-in health monitoring
6. **Responsive Design** - Works on desktop and mobile

---

## 🛠️ Development Workflow

### Local Development

```bash
# Terminal 1: Blog Dashboard
cd blog_generation_pipeline
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python blog_platform/app.py

# Terminal 2: Comment Dashboard
cd NewComemnt-feature-x-assistant
cp .env.example .env  # Configure .env first
npm install
npm run assistant:unified

# Terminal 3: Gateway
cd unified-dashboard
npm install
npm start
```

### Docker Development

```bash
# Development mode with hot reload
docker-compose -f docker-compose.dev.yml up

# Or run locally with volume mounts
cd unified-dashboard
npm start &
cd ../blog_generation_pipeline
python blog_platform/app.py &
cd ../NewComemnt-feature-x-assistant
npm run dev &
# All running locally
```

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Container won't start | Check Docker logs: `docker logs unified-dashboard` |
| MongoDB connection failed | Verify `MONGODB_URI` in `.env` |
| 502 Bad Gateway | Check if all services are running: `docker-compose ps` |
| Port already in use | Stop conflicting services: `lsof -i :5000` |
| Build fails | Check Dockerfile and prerequisites |

### Debugging Commands

```bash
# Docker logs
docker logs -f unified-dashboard

# Container status
docker ps -a

# Network troubleshooting
docker network inspect unified-dashboard-network

# Database connection test
python3 -c "from pymongo import MongoClient; client = MongoClient('MONGODB_URI'); print('OK')"

# Service health
curl http://localhost:8080/health
curl http://localhost:5000/
curl http://localhost:3500/
```

---

## 🔐 Security Considerations

1. **Environment Variables** - Never commit `.env` files
2. **API Keys** - Store in secure environment or secret manager
3. **Database** - Use MongoDB Atlas with proper authentication
4. **HTTPS** - Always use SSL in production
5. **CORS** - Configure allowed origins properly
6. **Input Validation** - Use Zod schemas to validate inputs

---

## 📚 Further Reading

- [Blog Generation Docs](blog_generation_pipeline/README.md)
- [Comment Assistant Docs](NewComemnt-feature-x-assistant/README.md)
- [Deployment Guide](DEPLOYMENT-GUIDE.md)
- [Quick Deploy Reference](QUICK-DEPLOY.md)

---

## 📝 Change Log

**2026-04-15:**
- Docker Compose configuration updated
- Port mappings added (8080, 5000, 3500)
- Environment variables documented
- Complete architecture documentation

---

## 👥 Team & Contributing

This project is maintained as a unified dashboard for content generation. All services are supported through the same deployment pipeline.

---

**Last Updated:** 2026-04-16
**Version:** 1.0.0
**Status:** ✅ Production Ready (with Docker)
# Unified Dashboard Repo Context

This file is a high-signal handoff for future AI runs. It explains the repository structure, how requests flow through the system, and which files matter most when making changes.

## 1. Mental Model

This workspace is not a single app. It is three connected services that are usually deployed together:

1. A root Express gateway that serves the landing page and proxies traffic.
2. A Flask blog generation backend in blog_generation_pipeline.
3. A separate Next.js comment assistant app inside NewComemnt-feature-x-assistant/NewComemnt-feature-x-assistant.

The gateway is the main public entry point. The blog app usually lives behind /blog. The comment assistant usually lives behind /comments. Direct API routing under /api is split between the two backends depending on the resource name.

## 2. Top-Level Layout

Important root files and folders:

- server.js: Express gateway and proxy logic.
- public/index.html: static landing page shown at /.
- blog_generation_pipeline/: Flask blog generation system.
- NewComemnt-feature-x-assistant/: parent folder for the Next.js assistant workspace.
- Dockerfile and docker-compose.yml: single-container multi-service deployment.
- start.sh and start-docker.sh: process startup scripts for the combined deployment.
- deploy-vps.sh and deploy-vps-comment.sh: VPS deployment scripts.
- nginx.conf: reverse proxy config for production.
- PROJECT-Architecture.md and DEPLOYMENT-GUIDE.md: extra architecture and deployment docs.

The repository also contains a few generated or runtime artifacts such as node_modules, .next, cookies.txt, and screenshot.png. Those are not the conceptual source of truth.

## 3. Request Flow

The gateway in server.js handles routing like this:

- / -> serves public/index.html.
- /health -> gateway health JSON.
- /blog and /blogs -> proxy to the Flask backend on port 5000.
- /comments -> proxy to the Next.js assistant on port 3500.
- /login and /logout -> redirect into /comments/login and /comments/logout.
- /api/* -> routed by resource name either to the blog backend or the comment assistant backend.
- /analytics -> routed to the comment assistant backend.

The comment assistant is mounted under /comments because its auth/session flow expects gateway-scoped cookies and rewritten redirects.

The /api router is important. The gateway restores the stripped prefix before proxying, then sends platform-specific endpoints to the comment assistant and everything else to the blog backend. This is one of the easiest places to break behavior if you edit proxy logic casually.

## 4. Root Gateway Details

Key file: server.js

Responsibilities:

- Serve the landing page from public/.
- Proxy blog traffic to the Flask app.
- Proxy comment assistant traffic to the Next.js app.
- Rewrite redirect locations for comment assistant auth.
- Split /api traffic based on whether the resource belongs to the comment platforms or blog backend.
- Expose /health for Docker and orchestration checks.

Notable implementation details:

- Blog paths use a path rewrite that strips /blog or /blogs.
- Comment paths use a path rewrite that strips /comments.
- Redirects from the comment assistant are rewritten back into the /comments namespace.
- Comment platforms recognized by the gateway include reddit, devto, hn, bluesky, and x.

## 5. Landing Page

File: public/index.html

This is a custom static landing page, not a React page. It presents the dashboard as a single entry point with two major cards: one for the blog dashboard and one for the comment dashboard.

The page uses a dark visual style with cyan, blue, and green gradients. It is intentionally polished because it is the first thing users see before entering either backend.

## 6. Blog Generation Pipeline

Root folder: blog_generation_pipeline/

This is a Flask-based system for scraping articles, generating blog content, and managing accounts/blog drafts.

Most important files:

- blog_platform/app.py: Flask API and dashboard server.
- blog_platform/config.py: config loader and account/topic definitions.
- blog_platform/database.py: MongoDB abstraction with in-memory fallback.
- blog_platform/blog_generator.py: LLM-driven generation engine with provider fallback.
- blog_platform/templates/index.html: dashboard UI template.
- wsgi.py: deployment shim for Gunicorn/Render.
- app.py: local entrypoint wrapper for the Flask app.
- scrape_to_mongo.py: RSS/article ingestion.
- wf1.py and workflow_common.py: workflow helpers and analysis utilities.

### Blog app behavior

The Flask app reads env vars early at import time. That means MONGODB_URI and MEGALLM_API_KEY must be present before the app imports cleanly. If MongoDB is unavailable, the code falls back to an in-memory database so the service can still start in degraded mode.

The dashboard serves at port 5000. It exposes routes for accounts, blogs, generation history, mark-as-posted, delete, analytics, and dashboard summaries. The UI is a template-driven Flask dashboard rather than a SPA.

### Blog configuration highlights

The config file defines:

- MongoDB connection details.
- MegaLLM primary settings and fallback models.
- A fallback provider chain that can move from MegaLLM to Chutes AI.
- Several predefined accounts and platform-specific metadata settings.
- Four main CTO-focused content topics with keywords and generation quotas.

The account list currently includes Blogger, Quora, Medium, Dev.to, and Tumblr-focused publishing targets plus a backup account. The exact configuration is part of the content strategy, not just UI labels.

Typical flow:

1. Scrape articles into MongoDB.
2. Optionally run workflow/analysis steps.
3. Generate blog content through MegaLLM.
4. Store drafts in MongoDB or in-memory fallback.
5. Mark posted or delete draft content from the dashboard.

### Blog docs to know

- blog_generation_pipeline/README.md: setup and architecture for the blog-only system.
- blog_generation_pipeline/RENDER_DEPLOYMENT.md: Render deployment details.
- blog_generation_pipeline/test_*.py: many focused debugging scripts for API connectivity, retry logic, status, and generation behavior.

## 7. Comment Assistant Workspace

Primary app path: NewComemnt-feature-x-assistant/NewComemnt-feature-x-assistant/

This is a separate Next.js application with its own package.json, src tree, docs, and tool folders. The awkward folder name is real and intentional in this repository. Do not rename it casually; the Docker and startup scripts assume it.

### Comment app package scripts

The root scripts inside the comment workspace cover three major groups:

- Next.js app lifecycle: dev, build, start.
- Pipeline commands: analyze, generate, post, improve, feedback, scheduling.
- Assistant commands: assistant:unified, assistant:reddit, assistant:devto, assistant:hn, assistant:bluesky, assistant:x and their fetch/draft/simulate variants.

The most important command for the unified dashboard is assistant:unified, which starts the central assistant UI on port 3500.

### Comment app structure

Important directories:

- src/app/: Next.js app router pages, layouts, admin UI, and API routes.
- src/lib/: AI provider logic, integrations, and pipeline utilities.
- src/workflows/: pipeline stage definitions.
- src/content/blog/: MDX blog content.
- tools/: standalone platform assistants and their local data caches.
- docs/: repo documentation for assistants and automation.
- scripts/: dev helpers and pipeline runners.

### Central assistant server

Key file: tools/unified-assistant/server.js

This server is the main comment-dashboard backend. It:

- Runs on port 3500 by default.
- Uses express-session auth.
- Defaults to admin@megallm.io / MegaLLM@SOCIAL unless env vars override them.
- Serves one authenticated UI for Reddit, Dev.to, Hacker News, Bluesky, and X.
- Exposes platform-specific endpoints such as /api/{platform}/fetch, /draft, /drafts, /cache, and draft-stream.
- Stores drafts and cached posts in per-platform JSON files under each tools/*-assistant/data directory.

This is the backend the root gateway proxies at /comments.

### Tool folders

Each platform folder contains its own fetch/draft/post workflow and local cache files.

- reddit-assistant: fetch Reddit posts, draft comments, simulate posting, manage queues.
- devto-assistant: fetch articles, draft comments, schedule posts, manage queue state.
- hackernews-assistant: fetch stories and draft comments.
- bluesky-assistant: fetch feed items and draft replies.
- x-assistant: fetch tweets and draft replies.

The tool folders are operationally important because the unified assistant server imports functions from them directly.

### Comment app docs

Important docs:

- docs/README.md: doc index.
- docs/assistants.md: unified assistant and per-platform script guide.
- docs/devto-automation.md: Dev.to-specific automation guidance.

## 8. Deployment Modes

### Local development

There are effectively three processes when running the full system locally:

1. blog_generation_pipeline Flask backend on port 5000.
2. NewComemnt-feature-x-assistant unified assistant on port 3500.
3. Root Express gateway on port 8080.

The root README and deployment docs show slightly different command sequences depending on whether you want the blog system, the comment system, or the combined gateway.

### Docker

Dockerfile builds a single container that includes:

- Python + the blog environment.
- Node + the gateway.
- The Next.js comment workspace.

docker-compose.yml maps ports 8080, 5000, and 3500 and passes environment variables through from .env.

Important startup scripts:

- start-docker.sh: Docker-focused process launcher.
- start.sh: more general startup script used for container/VPS flow.
- start-blog.sh: Gunicorn wrapper for the Flask app.

### VPS / Nginx / systemd

The repo includes:

- deploy-vps.sh and deploy-vps-comment.sh for automated setup.
- blog-dashboard.service and unified-gateway.service for systemd.
- nginx.conf for reverse proxy and SSL termination.

The deployment model is usually:

Browser -> Nginx -> Express gateway -> Flask/Next.js backends.

## 9. Environment Variables That Matter

There are many env vars, but the most important ones are:

For the blog backend:

- MONGODB_URI
- MONGODB_DB
- MEGALLM_API_KEY
- MEGALLM_BASE_URL
- MODEL and the fallback model vars
- SERPER_API_KEY
- FIRECRAWL_API_KEY

For the comment assistant:

- UNIFIED_ASSISTANT_USER
- UNIFIED_ASSISTANT_PASSWORD
- UNIFIED_SESSION_SECRET
- UNIFIED_ASSISTANT_PORT
- DEVTO_API_KEY
- DEVTO_USERNAME
- TWITTERAPI_IO_KEY
- GSC_SITE_URL
- CRON_SECRET

For the gateway:

- PORT
- BLOG_DASHBOARD_URL
- COMMENT_DASHBOARD_URL

## 10. Important Caveats

1. The NewComemnt folder name is misspelled on purpose and is referenced by scripts. Do not normalize it without updating every path reference.
2. The blog config reads env vars during import. If MONGODB_URI is missing, startup can fail immediately.
3. The comment assistant auth and redirects depend on gateway path rewriting. If you change proxy behavior, test /comments/login and /comments/logout.
4. The gateway distinguishes blog APIs from comment APIs by resource name. Editing that logic can break one backend while leaving the other apparently healthy.
5. Dockerfile references start-docker.sh. The root startup scripts and deployment docs should be kept in sync if process names change.
6. Some docs are slightly out of date or overlap. Treat server.js, the Flask app, and the unified assistant server as the source of truth for runtime behavior.

## 11. High-Value Files To Read Next

If you only inspect a few files after this one, read these first:

- server.js
- public/index.html
- blog_generation_pipeline/blog_platform/app.py
- blog_generation_pipeline/blog_platform/config.py
- blog_generation_pipeline/blog_platform/database.py
- blog_generation_pipeline/README.md
- NewComemnt-feature-x-assistant/NewComemnt-feature-x-assistant/tools/unified-assistant/server.js
- NewComemnt-feature-x-assistant/NewComemnt-feature-x-assistant/package.json
- NewComemnt-feature-x-assistant/NewComemnt-feature-x-assistant/docs/assistants.md
- Dockerfile
- docker-compose.yml
- start.sh
- start-docker.sh

## 12. Short Summary

This repo is a unified content platform with a proxy gateway on top. The root gateway is the main public surface, the Flask blog app handles blog generation and blog management, and the nested Next.js workspace handles the multi-platform comment assistants and content pipeline. Most of the complexity is in routing, auth/session rewriting, and the deployment scripts that keep all three services aligned.
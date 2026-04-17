# Docker Deployment Guide for Unified Dashboard

This guide shows you how to run the unified dashboard using Docker.

## Prerequisites

- Docker and Docker Compose installed
- `.env` file configured with your required environment variables

## Quick Start

### 1. Build and Run with Docker Compose

```bash
# In the unified-dashboard directory
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### 2. Access the Services

Once running:

- **Gateway**: http://localhost:8080
- **Blog Dashboard**: http://localhost:5000
- **Comment Dashboard**: http://localhost:3500

### 3. Check Health

```bash
# Check all services
curl http://localhost:8080/health

# Check blog dashboard
curl http://localhost:5000/health

# Check comment dashboard
curl http://localhost:3500/
```

## Docker Compose Configuration

The `docker-compose.yml` file includes:

### Port Mapping
- `8080:8080`: Express Gateway (main entry point)
- `5000:5000`: Flask Blog Dashboard
- `3500:3500`: Next.js Comment Dashboard

### Environment Variables
All required environment variables from your `.env` file are passed through automatically.

### Volumes
- `unified-dashboard-logs`: Persistent log storage

### Networks
- `unified-dashboard-network`: Bridge network for inter-service communication

## Troubleshooting

### Build Issues

**Error: Next.js standalone build failed**

```bash
# Rebuild with no cache
docker-compose build --no-cache

# Or rebuild specific service
docker-compose build comment-dashboard
```

**Error: Python installation failed**

```bash
# Rebuild the base image
docker-compose build --no-cache
```

### Container Won't Start

**Check if container is running:**
```bash
docker ps -a
```

**View logs:**
```bash
# Container logs
docker logs unified-dashboard

# Or specific service logs
docker exec unified-dashboard tail -f /var/log/blog-dashboard.log
docker exec unified-dashboard tail -f /var/log/comment-dashboard.log
docker exec unified-dashboard tail -f /var/log/unified-gateway.log
```

**Common startup issues:**
1. Missing environment variables - check your `.env` file
2. MongoDB connection errors - verify `MONGODB_URI` is correct
3. API key issues - verify `MEGALLM_API_KEY`, `SERPER_API_KEY`, etc.

### Service Not Responding

**Test connectivity:**
```bash
# Test internal service connectivity
docker exec unified-dashboard curl http://localhost:5000/health
docker exec unified-dashboard curl http://localhost:3500/
docker exec unified-dashboard curl http://localhost:8080/health
```

**Restart services:**
```bash
docker-compose restart
```

### Memory Issues

**Increase memory limit:**
```yaml
# In docker-compose.yml, add to the service:
services:
  unified-dashboard:
    mem_limit: 2g
    mem_reservation: 1g
```

### Uninstalling

**To completely remove everything:**
```bash
docker-compose down -v
docker system prune -a
```

## Development Mode

For development, you can use Docker Compose with volume mounts:

```yaml
# In docker-compose.yml, modify volumes section:
volumes:
  - ./blog_generation_pipeline:/app/blog_generation_pipeline
  - ./NewComemnt-feature-x-assistant:/app/comment-dashboard
  - unified-dashboard-logs:/var/log
```

Then rebuild and restart:
```bash
docker-compose up -d --build
```

## Monitoring

**View real-time logs:**
```bash
docker-compose logs -f unified-dashboard
```

**Resource usage:**
```bash
docker stats unified-dashboard
```

**Interactive shell:**
```bash
docker exec -it unified-dashboard sh
```

## Production Deployment

For production, consider:

1. **Use a reverse proxy** (Nginx) outside Docker
2. **Expose only ports 80/443** and handle routing internally
3. **Use health checks** - already configured in docker-compose.yml
4. **Set up logging aggregation** (ELK, Loki, etc.)
5. **Enable monitoring** (Prometheus, Grafana)
6. **Configure auto-scaling** for horizontal scaling

**Example Nginx configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

## Custom Docker Run

You can also run Docker directly without Compose:

```bash
docker run -d \
  --name unified-dashboard \
  --env-file .env \
  -p 8080:8080 \
  -p 5000:5000 \
  -p 3500:3500 \
  -v unified-dashboard-logs:/var/log \
  unified-dashboard:latest
```

## Best Practices

1. **Never commit `.env` files** to version control
2. **Use `.dockerignore`** to avoid copying unnecessary files
3. **Keep dependencies updated** - regularly pull latest base images
4. **Monitor log sizes** to avoid disk issues
5. **Test backups** of database and configuration
6. **Use explicit version tags** for Docker images in production
7. **Rebuild images** after updating code

## Support

If you encounter issues:

1. Check this troubleshooting section
2. Review logs with `docker logs`
3. Verify environment variables in `.env`
4. Test individual services directly
5. Check Docker documentation

---

**Last Updated:** 2026-04-16
# Production Deployment

This project is ready to run on a VPS with Docker Compose. The production compose file exposes only the frontend nginx container publicly; nginx serves the Vite build and proxies `/api` and `/uploads` to `api-gateway` inside the Docker network.

## Server Requirements

- Ubuntu/Debian VPS with ports `80` and optionally `443` open
- Docker Engine and Docker Compose plugin
- A domain DNS `A` record pointing to the server IP

## First Deploy

Copy the project to the server, then create the production env file:

```bash
cp .env.production.example .env
nano .env
```

Set real values:

```env
CORS_ORIGIN=https://your-domain.example
PUBLIC_BASE_URL=https://your-domain.example
POSTGRES_PASSWORD=very_long_random_password
SERVICE_API_KEY=very_long_random_internal_key
JWT_SECRET=very_long_random_gateway_secret
USER_SERVICE_JWT_SECRET=very_long_random_user_secret
VITE_API_URL=/api
HTTP_PORT=80
```

Start the stack:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Check status and logs:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api-gateway
```

Health checks:

```bash
curl http://localhost/health
curl http://localhost/api/search/cars
```

## Updates

After pulling or copying new code:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## HTTPS

The included compose file serves HTTP on port `80`. For HTTPS, put Caddy, Nginx Proxy Manager, Cloudflare Tunnel, or a host-level nginx with Let's Encrypt in front of this stack, then keep:

```env
CORS_ORIGIN=https://your-domain.example
PUBLIC_BASE_URL=https://your-domain.example
VITE_API_URL=/api
```

## Backups

Database and uploads live in Docker volumes:

- `postgres_data`
- `media_uploads`
- `gateway_data`

Back them up before server migrations or destructive Docker cleanup.

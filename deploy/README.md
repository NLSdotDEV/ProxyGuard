# ProxyGuard Production Deployment

This directory contains the production Docker deployment stack and Caddy reverse proxy configuration for **ProxyGuard**.

---

## Architecture Overview

```
                      Internet
                         │
                         ▼
        ┌──────────────────────────────────┐
        │       Caddy Reverse Proxy        │
        │   (proxy-guard.nxlive.site)      │
        │   - Automatic TLS (Let's Encrypt)│
        │   - Security Headers (HSTS, etc) │
        │   - Real IP Anti-Spoofing        │
        │   - Internal IP Allowlist Only   │
        └────────────────┬─────────────────┘
                         │ proxyguard-network (bridge)
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│  ProxyGuard App  │ ─────────> │   Redis Cache    │
│  (Port 3000)     │            │   (Port 6379)    │
│  - SQLite Volume │            │   - AOF Persistence│
│  - BullMQ Workers│            └──────────────────┘
└──────────────────┘
```

---

## Key Security Features

1. **Internal IP Isolation**:
   - `app` and `redis` ports are **NOT** published on `0.0.0.0`. They are strictly mapped to the loopback interface (`127.0.0.1`) on the host, preventing external access bypassing Caddy.
   - In [`Caddyfile`](./Caddyfile), access to `proxy-guard.nxlive.site` is restricted to private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `100.64.0.0/10`), loopback (`127.0.0.1`), and any custom server IPs defined in `ALLOWED_INTERNAL_IPS`.
   - External web traffic attempting to reach the domain receives an immediate `403 Forbidden`.

2. **Real Client IP Anti-Spoofing**:
   - Caddy strips any client-provided `X-Forwarded-For` and `X-Real-IP` headers and replaces them strictly with `{remote_host}` (the genuine client TCP socket address).
   - Fastify is configured with `trustProxy: true`, ensuring application rate limiting (e.g. 10 req/min on `/lease`) accurately evaluates the true client IP and cannot be bypassed.

3. **Hardened HTTP Security Headers**:
   - `Strict-Transport-Security` (HSTS) with `preload`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy: default-src 'none'; frame-ancestors 'none';`
   - Server identification stripped (`-Server`).

4. **Data Persistence**:
   - SQLite database is persisted in the `app-storage` volume mapped to `/app/src/storage`.
   - Redis append-only log is persisted in the `redis-data` volume.
   - Caddy TLS certificates and configurations are persisted in `caddy-data` and `caddy-config`.

---

## Deployment Steps

### 1. Configure DNS

Ensure `proxy-guard.nxlive.site` points (A/AAAA record) to your server's public IP address so Caddy can obtain an SSL certificate via ACME.

### 2. Configure Environment

Copy the example environment file:

```bash
cp deploy/.env.example deploy/.env
```

Adjust `ALLOWED_INTERNAL_IPS` if you have specific internal or VPN IP addresses that should be permitted.

### 3. Build & Launch

From the project root:

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

Or from the `deploy/` directory:

```bash
cd deploy && docker compose up -d --build
```

### 4. Verify Health

Check container status and logs:

```bash
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs -f app
```

Test healthcheck locally:

```bash
curl -I http://127.0.0.1:3000/health
```

# ProxyGuard

[![Fastify](https://img.shields.io/badge/Fastify-5.x-000000?logo=fastify&logoColor=white)](https://fastify.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Self-Hosted](https://img.shields.io/badge/Self--Hosted-Open%20Source-blue.svg)](<>)

A lightweight, zero-configuration proxy manager designed for ProxyScrape datacenter IPs. Simply provide your API token, and this tool handles the heavy lifting: it loads your account details, manages configurable sticky sessions (default 1-minute caching), formats target URLs, and automatically rotates IPs the moment you report a ban. Never worry about manual proxy rotation or silent pool exhaustion again.

Built as an open-source, self-hosted **Fastify REST API**, ProxyGuard eliminates the need for complex scraper-side rotation logic. There are **no accounts to create** and **no hardcoded API keys in environment files**—you simply spin up the service, submit your ProxyScrape key via the API endpoint, and start scraping.

---

## Features

- **⚡ One-Shot API Key Submission:** Submit your ProxyScrape datacenter API key directly via an endpoint. ProxyGuard contacts ProxyScrape, fetches your sub-account details, username & password credentials, plan information, and loads all attached proxies into memory.
- **🔓 Zero-Setup & Self-Hosted:** No database migrations, user registries, or local account creation required. Host it privately on your own infrastructure and attach your own network protection, reverse proxy, or API guard as needed.
- **🛡️ Automated Ban Management:** Formats and supplies active proxies for target URLs. When your scraper hits an anti-bot block (e.g. 403 or 429), post the proxy ID to `/api/ban`. ProxyGuard immediately blacklists the bad IP and serves a fresh, clean proxy on the next call.
- **⏱️ Configurable Sticky Sessions:** Prevents rapid IP pool burnout by maintaining sticky proxy sessions (default: 60-second TTL) per target host. TTL is fully customizable via API parameters.
- **🚨 Pool Exhaustion Alerts:** When all proxies linked to your key are banned or exhausted, the API immediately returns an explicit `503 Service Unavailable` with pool diagnostics so your scrapers can halt or alert you without silent failures.

---

## Getting Started

### Prerequisites

- **Node.js** (v20+ recommended)
- **npm**, **pnpm**, or **yarn**
- A **ProxyScrape** Datacenter account and API key

### 1. Clone & Install

```bash
git clone https://github.com/NLSdotDEV/ProxyGuard.git
cd ProxyGuard
npm install
```

### 2. Configure Server Settings (Optional)

You only need standard server port/host settings—**no ProxyScrape credentials go here**:

```env
PORT=3000
HOST=0.0.0.0
```

### 3. Start the Fastify Server

```bash
# Development mode with hot-reload (tsx + nodemon)
npm run dev

# Or build and start for production
npm run build
npm start
```

The Fastify API will start listening on `http://localhost:3000`.

---

## API Reference

### 1. Submit Key & Initialize Pool

Submit your ProxyScrape datacenter API key. ProxyGuard immediately retrieves your sub-account credentials, inspects your plan limits, and hydrates the proxy pool into memory.

- **Endpoint:** `POST /api/key` (or `POST /api/init`)
- **Content-Type:** `application/json`

**Request Body:**

```json
{
  "apiKey": "your_proxyscrape_datacenter_api_key",
  "cacheTime": 60
}
```

| Parameter   | Type     | Required | Default | Description                                             |
| :---------- | :------- | :------- | :------ | :------------------------------------------------------ |
| `apiKey`    | `string` | **Yes**  | —       | Your ProxyScrape datacenter API key.                    |
| `cacheTime` | `number` | No       | `60`    | Default sticky session TTL in seconds for this session. |

**Response (`200 OK`):**

```json
{
  "status": "success",
  "message": "ProxyScrape account loaded successfully",
  "account": {
    "subAccount": "sub_98124",
    "username": "dc_user",
    "plan": "Datacenter Dedicated",
    "totalProxies": 100,
    "activeProxies": 100
  }
}
```

---

### 2. Request a Proxy for a Target URL

Retrieves a healthy, authenticated proxy formatted for your target URL. Reuses the active proxy if a sticky session exists within the TTL window, or leases a fresh one.

- **Endpoint:** `POST /api/proxy`
- **Content-Type:** `application/json`

**Request Body:**

```json
{
  "targetUrl": "https://example.com/products",
  "cacheTime": 60
}
```

| Parameter   | Type     | Required | Default | Description                                                       |
| :---------- | :------- | :------- | :------ | :---------------------------------------------------------------- |
| `targetUrl` | `string` | **Yes**  | —       | Destination URL being scraped. Used to key sticky session caches. |
| `cacheTime` | `number` | No       | `60`    | Override sticky session TTL in seconds for this request.          |

**Response (`200 OK`):**

```json
{
  "proxyId": "ps_dc_104_28_1_8080",
  "proxyUrl": "http://dc_user:password123@104.28.1.1:8080",
  "host": "104.28.1.1",
  "port": 8080,
  "auth": {
    "username": "dc_user",
    "password": "password123"
  },
  "sticky": true,
  "expiresAt": "2026-10-18T06:10:00.000Z"
}
```

**Response (`503 Service Unavailable - Pool Exhausted`):**

```json
{
  "error": "POOL_EXHAUSTED",
  "message": "All proxies associated with this key are banned or exhausted.",
  "totalProxies": 100,
  "bannedCount": 100
}
```

---

### 3. Report a Ban

When your scraper receives an anti-bot block (403, 429, CAPTCHA), notify ProxyGuard. The proxy is instantly marked as banned, removed from the pool, and discarded from active sticky sessions.

- **Endpoint:** `POST /api/ban`
- **Content-Type:** `application/json`

**Request Body:**

```json
{
  "proxyId": "ps_dc_104_28_1_8080",
  "reason": "HTTP 403 Forbidden"
}
```

| Parameter | Type     | Required | Description                                              |
| :-------- | :------- | :------- | :------------------------------------------------------- |
| `proxyId` | `string` | **Yes**  | The proxy identifier returned by `/api/proxy`.           |
| `reason`  | `string` | No       | Optional description or HTTP status code for audit logs. |

**Response (`200 OK`):**

```json
{
  "status": "banned",
  "proxyId": "ps_dc_104_28_1_8080",
  "remainingActive": 99,
  "message": "Proxy evicted from active pool."
}
```

---

### 4. Pool Health & Status

Check current pool metrics, plan details, and ban counts.

- **Endpoint:** `GET /api/status`

**Response (`200 OK`):**

```json
{
  "status": "healthy",
  "subAccount": "sub_98124",
  "plan": "Datacenter Dedicated",
  "pool": {
    "total": 100,
    "active": 99,
    "banned": 1
  },
  "activeStickySessions": 8
}
```

---

## Quick Start / Usage

Here is a typical workflow showing how an external scraper interacts with the self-hosted ProxyGuard API:

```typescript
import axios from 'axios';

const PROXYGUARD_API = 'http://localhost:3000';
const TARGET_URL = 'https://example.com/data';

async function run() {
  // 1. Submit your ProxyScrape key once via the API
  await axios.post(`${PROXYGUARD_API}/api/key`, {
    apiKey: 'YOUR_PROXYSCRAPE_DATACENTER_API_KEY',
    cacheTime: 60, // 60s sticky sessions
  });

  console.log('ProxyGuard initialized with ProxyScrape key!');

  // 2. Request an active proxy for your target URL
  const { data: proxyData } = await axios.post(`${PROXYGUARD_API}/api/proxy`, {
    targetUrl: TARGET_URL,
  });

  const { proxyId, host, port, auth } = proxyData;
  console.log(`Leased proxy ${proxyId} (${host}:${port})`);

  try {
    // 3. Make scraping request using the leased proxy
    const response = await axios.get(TARGET_URL, {
      proxy: { host, port, auth },
      timeout: 10000,
    });

    console.log('Scraped successfully! HTTP Status:', response.status);
    return response.data;
  } catch (error: any) {
    // 4. Report ban if target site blocks the request
    if (error.response && [403, 429].includes(error.response.status)) {
      console.warn(`Proxy ${proxyId} banned. Reporting to ProxyGuard...`);

      await axios.post(`${PROXYGUARD_API}/api/ban`, {
        proxyId,
        reason: `HTTP ${error.response.status}`,
      });

      console.log('Proxy evicted. Ready to fetch clean IP on next request.');
    }

    throw error;
  }
}

run().catch(console.error);
```

---

## How it Works (Under the Hood)

```
                       ┌────────────────────────────────────────┐
                       │       ProxyScrape Datacenter API       │
                       └───────────────────┬────────────────────┘
                                           │
                                1. POST /api/key: Hydrates
                                   Sub-account, Auth, & Proxies
                                           │
                                           ▼
 ┌──────────────────────┐          ┌───────────────────────────────────┐
 │                      │  2. POST │          ProxyGuard Core          │
 │                      ├─────────►│         (Fastify Server)          │
 │                      │ /api/proxy ├───────────────────┬───────────────┤
 │                      │◄─────────┤  Sticky Session     │  Active Pool  │
 │      Scraper /       │  Proxy   │  Cache (TTL: 60s)   │  & Blacklist  │
 │     HTTP Client      │  Config  └─────────┬───────────┴───────┬───────┘
 │                      │                    │                   │
 │                      │  3. Report 403/429 │                   │
 │                      ├───────────────────►│  4. Evict Banned  │
 │                      │  POST /api/ban     │  IP & Rotate      │
 └──────────────────────┘                    ▼                   ▼
                                     [ If Pool Empty ➔ 503 Pool Exhausted ]
```

1. **API-Driven Hydration:** Upon calling `/api/key`, ProxyGuard queries ProxyScrape to retrieve sub-account credentials, inspect plan quotas, and load all datacenter proxies into an in-memory manager.
2. **Sticky Session Caching:** Instead of changing IPs per HTTP call—which causes immediate anti-bot triggers and exhausts pools—ProxyGuard assigns a proxy to a target domain/session and caches it for `cacheTime` (default 60 seconds).
3. **Ban-Shifting Logic:** When your scraper alerts ProxyGuard of a ban (`POST /api/ban`), ProxyGuard immediately moves the proxy to an eviction set, removes it from active sticky sessions, and rotates to the next healthy proxy in line.
4. **Pool Exhaustion Prevention:** If all proxies in the pool are marked as banned, the API returns a clear `503 POOL_EXHAUSTED` response rather than timing out, allowing monitoring services or scrapers to halt cleanly.

---

## The Aegis Core Framework & Greek Mythology

ProxyGuard's internal engine foundation is built upon our in-house framework called **Aegis** (`#aegis/*`).

### The Mythological Origin

In ancient Greek mythology, the **Aegis** (Ancient Greek: αἰγίς, _aigís_) is the legendary shield or protective cloak carried by **Zeus** and famously wielded by **Athena**, the goddess of wisdom, warfare strategy, and intellect. The Aegis was revered as an impenetrable instrument of defense—capable of deflecting any assault, protecting heroes from danger, and commanding absolute authority on the battlefield.

### Why Aegis for ProxyGuard?

We chose the name **Aegis** for ProxyGuard's core framework because it embodies our central architectural mission:

- **🛡️ A Shield for Scraping Pipelines:** Just as the mythical Aegis deflected strikes in battle, our framework shields scraping pipelines from IP bans, rate limits, pool exhaustion, and upstream proxy instability.
- **🏛️ Architectural Discipline & Wisdom:** Guided by Athena's strategic mindset, Aegis enforces strict single-action service boundaries, robust BullMQ queue/worker lifecycles, and isolated route-mapping controllers.
- **⚡ Resilience & Self-Healing:** The Aegis framework powers automated ban mitigation, real-time eviction of compromised IPs, and seamless session fallback so that scrapers continue running without disruption.

---

## Security & Guards

Because ProxyGuard is an open-source, self-hosted utility designed for direct integration with scraping pipelines:

- **No User Management:** It does not force authentication databases, registration forms, or user account models.
- **Custom Protection / Guards:** When deploying to shared or cloud environments, you can easily secure the API by:
  - Adding a Fastify `preHandler` hook (e.g. Bearer token / secret header validation).
  - Placing the service behind a reverse proxy (Nginx, Caddy, Cloudflare Access, or Traefik).
  - Binding the service to `127.0.0.1` or placing it in an internal Docker network / VPN accessible only by your scrapers.

---

## Development & Scripts

```bash
npm run dev     # Starts Fastify with nodemon and tsx auto-reload
npm run build   # Compiles TypeScript to dist/
npm run lint    # Runs ESLint code quality checks
npm run format  # Formats all files with Prettier
npm start       # Runs the compiled production server from dist/main.js
```

---

## License

This project is licensed under the [MIT License](LICENSE).

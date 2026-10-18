# ProxyGuard Agent Guidelines & Architectural Standards

Welcome to **ProxyGuard**. This document is the primary architectural directive and rulebook for all AI coding agents working in this repository. You must adhere strictly to the conventions and patterns outlined below.

---

## 1. Project Mission & Technology Stack

ProxyGuard is a self-hosted, high-performance proxy management REST API designed for ProxyScrape datacenter accounts. It manages account hydration, sticky sessions, ban mitigation, and proxy leasing.

- **HTTP Framework**: Fastify 5 (`fastify`)
- **Schema Validation & Types**: TypeBox (`typebox`, `@fastify/type-provider-typebox`)
- **Language & Runtime**: TypeScript 5.7+ (Node.js ESM, `target: ESNext`, `"type": "module"`)
- **Database & ORM**: SQLite (`src/storage/database.sqlite`) managed via **MikroORM**
- **Cache & Sticky Sessions**: Redis via `ioredis`
- **Background Jobs**: BullMQ (`bullmq`) for async proxy hydration and health checks
- **Security / Admin**: `argon2` (reserved for upcoming self-hosted admin management)

---

## 2. Directory Structure Conventions

```text
ProxyGuard/
├── .agents/
│   ├── rules/
│   │   └── architecture-standards.md
│   └── skills/
│       ├── feature-scaffolder/
│       ├── service-creator/
│       └── architecture-auditor/
├── src/
│   ├── main.ts                       # Fastify initialization & server start
│   ├── bootstrap/
│   │   ├── app.ts                    # Bootstrap plugins, database, redis, router
│   │   └── database.ts               # MikroORM init & schema sync
│   ├── routes/
│   │   └── router.ts                 # Central /api/v1 router mounting feature plugins
│   ├── database/
│   │   ├── db.ts                     # MikroORM EntityManager export & helpers
│   │   └── entities/                 # MikroORM entities (*.entity.ts)
│   ├── cache/
│   │   └── redis.ts                  # ioredis client singleton & sticky cache helpers
│   ├── jobs/
│   │   ├── queues/                   # BullMQ queue instances
│   │   └── workers/                  # BullMQ worker processors
│   ├── shared/
│   │   ├── guards/                   # Fastify preHandler hooks (e.g. api-key.guard.ts)
│   │   └── interfaces/               # ONLY interfaces shared across multiple features
│   ├── storage/                      # SQLite database files and persistent storage
│   └── features/                     # Feature modules
│       └── <feature>/
│           ├── <feature>.routes.ts
│           ├── <feature>.schema.ts
│           ├── <feature>.controller.ts
│           └── services/
│               ├── find-<feature>.service.ts
│               └── <action>-<feature>.service.ts
```

---

## 3. Strict Feature Architecture

Every feature under `src/features/<feature>/` must strictly follow the 4-layer structure:

### 3.1 Schemas (`<feature>.schema.ts`)

- Use TypeBox (`Type.Object(...)`) for all request bodies, params, query parameters, and responses.
- Export static TypeScript types using `Static<typeof ...>`.
- Keep schemas grouped in an exported object (e.g., `export const ProxySchema = { ... }`).

### 3.2 Routes (`<feature>.routes.ts`)

- Export a `FastifyPluginAsync` function.
- Attach TypeBox schemas to every route.
- Handlers should only call the controller:
  ```typescript
  fastify.post(
    '/lease',
    {
      schema: {
        body: ProxySchema.lease,
        response: { 200: ProxySchema.leasedResponse },
      },
    },
    async (request, reply) => await proxyController.lease(request, reply),
  );
  ```

### 3.3 Controller (`<feature>.controller.ts`)

- Controllers are thin orchestrators. They handle HTTP request extraction and reply status/sending.
- Controllers can optionally extend the base `Controller` class (`import { Controller } from '../../shared/controllers/controller.js'`) to inherit shared response/error helpers.
- **ZERO business logic in controllers**.
- Injects `find-<feature>.service.ts` and relevant single-action services via constructor.
- Export both the class and a default instantiated singleton.

### 3.4 Services (`services/`) — Strict Rules

1. **Query Service (`find-<feature>.service.ts`)**:
   - Contains **ONLY TWO methods**:
     - `findAll(...)`
     - `findOne(id: string)`
   - Do NOT add any other methods to `find-*.service.ts`.
2. **Single-Action Services (`<action>-<feature>.service.ts`)**:
   - All other services in `services/` must be **Single-Action Classes**.
   - Must contain **EXACTLY ONE method**: `handle(dto: ActionDto): Promise<Result>`.
   - Never combine multiple actions (e.g., do not create `proxy.service.ts` with `lease()`, `ban()`, `sync()`). Create:
     - `lease-proxy.service.ts` -> `handle(dto: LeaseProxyDto)`
     - `report-proxy-ban.service.ts` -> `handle(dto: ReportProxyBanDto)`
     - `sync-proxy-account.service.ts` -> `handle(dto: SyncProxyAccountDto)`

### 3.5 DTO & Interface Placement

- **Single-Use DTOs**: If an interface or DTO is only needed by that specific service, declare and export it directly from that service file:
  ```typescript
  // In src/features/proxy/services/lease-proxy.service.ts
  export interface LeaseProxyDto {
    targetUrl: string;
    cacheTime?: number;
  }
  ```
- **Shared Interfaces**: If an interface is reused across multiple features or services, place it in `src/shared/interfaces/` (e.g., `src/shared/interfaces/pagination.interface.ts`).

---

## 4. Data, Cache & Job Workflows

### 4.1 Application & Key Generation

- Applications register to receive an `id` and `token`.
- Protected routes validate this token via Fastify guard (`x-app-token` or `Authorization: Bearer <token>`).

### 4.2 Account Creation & Async Hydration (BullMQ)

- When a user submits a ProxyScrape key via `POST /api/v1/proxy-accounts`:
  1. Create the `ProxyAccount` entity in SQLite with `status: 'inactive'`.
  2. Dispatch an `account-hydration` job to Redis via BullMQ.
  3. Return `202 Accepted` immediately with the account ID and `status: 'inactive'`.
  4. The BullMQ worker connects to ProxyScrape, fetches credentials and proxy list, persists `Proxy` entities, and flips the account status to `'active'`.

### 4.3 Proxy Leasing & Target-Scoped Ban Filtering

- When leasing a proxy for a `targetUrl`:
  1. Check Redis for an existing sticky session for `targetUrl` (domain-keyed).
  2. If miss or expired, query SQLite for healthy proxies belonging to the application's active accounts that have **NOT been marked as banned for that target URL** (`ProxyBan` table).
  3. Cache the assigned proxy in Redis with TTL (`cacheTime`, default: 60s).
  4. Return formatted proxy credentials.

### 4.4 Ban Reporting

- When a ban is reported (`POST /api/v1/proxies/ban`):
  1. Save a `ProxyBan` record in SQLite linking the proxy and `targetUrl`.
  2. Evict the Redis sticky session for that target URL so subsequent requests receive a non-banned IP.

---

## 5. Coding Rules & Constraints

- **ESM Imports**: All relative TypeScript imports must include the `.js` extension (e.g., `import { Router } from '../routes/router.js';`).
- **Linter & Formatter**: Run `npm run lint` and `npm run format` after modifications.
- **Type Safety**: Avoid using `any`. Use TypeBox `Static<typeof ...>` and strongly-typed Fastify request/reply objects.
- **Router Mounting**: All feature routes are registered in `src/routes/router.ts` with prefix `api/v1/<feature>`.

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
- **Internal Core Framework**: **Aegis** (`#aegis/*`) — in-house framework packages developed by ProxyGuard developers providing base primitives, foundation classes, controllers, and queue systems (analogous to Laravel's `Illuminate`)
- **Security / Admin**: `argon2` (reserved for upcoming self-hosted admin management)

### 1.1 Architectural Philosophy: Why "Aegis"? (Greek Mythology)

In ancient Greek mythology, the **Aegis** (Ancient Greek: αἰγίς, _aigís_) is the legendary shield or protective garment borne by **Zeus** and famously wielded by **Athena**, the goddess of wisdom, battle strategy, and intellect. Known as an impenetrable divine defense, the Aegis shielded its bearers from every attack, protected heroes during perilous trials, and commanded absolute authority on the battlefield.

For **ProxyGuard**, an infrastructure designed to shield scrapers, mitigate bans, and defend against proxy pool degradation, naming our internal core framework **Aegis** (`#aegis/*`) reflects our central engineering ethos:

- **Impenetrable Defense**: Just as the mythical Aegis deflected mortal and divine assaults, the Aegis framework insulates ProxyGuard's core application logic from upstream proxy degradation, target bans, and pool exhaustion.
- **Strategic Wisdom & Discipline**: Wielded in the spirit of Athena, Aegis enforces structured architectural patterns (`Controller`, `Queue`, `Worker`, `Producer`), ensuring zero business logic in controllers, single-action clarity in services, and disciplined background job lifecycles.
- **Resilience Under Siege**: When scrapers face aggressive anti-bot countermeasures (HTTP 403, 429, CAPTCHAs), Aegis primitives power immediate ban shifting, sticky session preservation, and self-healing pool management.

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
│   ├── core/packages/                # Internal aegis framework packages developed by ProxyGuard devs (#aegis/*)
│   │   ├── controller/
│   │   │   ├── controller.ts         # Base abstract Controller class
│   │   │   └── index.ts
│   │   └── queues/
│   │       ├── queue.ts              # Base abstract Queue class
│   │       ├── queue.worker.ts       # Base abstract Worker class
│   │       ├── queue.producer.ts     # Base abstract Producer class
│   │       └── index.ts
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
│               ├── find-<feature>.service.ts    # OPTIONAL: Only if feature has CRUD/query
│               └── <action>-<feature>.service.ts # Single-action classes
```

---

## 3. Strict Feature Architecture

Every feature under `src/features/<feature>/` must strictly follow the architectural pattern:

### 3.1 Schemas (`<feature>.schema.ts`)

- Use TypeBox (`Type.Object(...)`) for all request bodies, params, query parameters, and responses.
- Export static TypeScript types using `Static<typeof ...>`.
- Keep schemas grouped in an exported object (e.g., `export const ProxySchema = { ... }`).

### 3.2 Routes (`<feature>.routes.ts`)

- Export a `FastifyPluginAsync` function.
- Attach TypeBox schemas to every route.
- Handlers in the route file ONLY invoke the controller's mapped method:
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

### 3.3 Controller (`<feature>.controller.ts`) — Rules & Responsibilities

- **Mandatory Base Class**: Every controller **MUST extend the abstract `Controller` class** (`import { Controller } from '#aegis/controller/controller.js'`).
- **Exactly One Controller per Feature**: A feature must contain **only one** controller file (`<feature>.controller.ts`).
- **Pure Route Mapper**: The controller is directly a route mapper.
  - It contains **ZERO business logic**.
  - Each method in the controller represents a route mapped inside the feature itself.
  - It grabs data from the request (`request.body`, `request.params`, `request.query`, headers) and passes it down to the appropriate service (`service.handle(dto)` or `findService.findAll()` / `findService.findOne()`).
  - Sends the response and status code back to the client (`reply.status(...).send(...)`).
- Injects services via constructor and calls `super()`.
- Export both the class and a default instantiated singleton.

```typescript
import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller } from '#aegis/controller/controller.js';
import leaseProxyService, {
  LeaseProxyService,
} from './services/lease-proxy.service.js';
import { LeaseProxySchemaType } from './proxy.schema.js';

export class ProxyController extends Controller {
  constructor(private readonly leaseProxyService: LeaseProxyService) {
    super();
  }

  // Each method directly maps to a route in proxy.routes.ts
  async lease(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as LeaseProxySchemaType;
    const response = await this.leaseProxyService.handle(body);
    reply.status(200).send(response);
  }
}

export default new ProxyController(leaseProxyService);
```

### 3.4 Services (`services/`) — Strict Rules

1. **Query Service (`find-<feature>.service.ts`) is OPTIONAL**:
   - **Not all features need a find service**. Only features that require querying collections or finding items by ID (CRUD features) should have it.
   - For example, an `auth` feature with `auth-login.service.ts` and `auth-signup.service.ts` does NOT need a `find-auth.service.ts`.
   - If present, it contains **ONLY TWO methods**:
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

## 4. Route Registration Architecture

Route registration follows a strict hierarchy:

1. **Inside Feature**: Feature endpoints are mapped in `src/features/<feature>/<feature>.routes.ts` calling the feature controller's methods.
2. **Feature Export**: `<feature>.routes.ts` exports `<Feature>Routes: FastifyPluginAsync`.
3. **Global Router (`src/routes/router.ts`)**:
   - All feature route plugins are imported and registered inside the `routes` constant with their feature prefix.
   - The `Router` class registers the `routes` plugin with the version prefix (e.g. `api/v1`):

   ```typescript
   import { FastifyInstance, FastifyPluginAsync } from 'fastify';
   import { AppRoutes } from '../features/app/app.routes.js';
   import { ProxyRoutes } from '../features/proxy/proxy.routes.js';

   // define routes
   const routes: FastifyPluginAsync = async (fastify, _opts) => {
     fastify.register(AppRoutes, { prefix: 'app' });
     fastify.register(ProxyRoutes, { prefix: 'proxy' });
   };

   export class Router {
     static async define(instance: FastifyInstance) {
       const v1 = 'v1';
       const currentVersion = v1;
       instance.register(routes, { prefix: `api/${currentVersion}` });
     }
   }
   ```

4. **Bootstrap (`src/bootstrap/app.ts`)**:
   - `Router.define(server)` is invoked inside the `boostrap` function, ensuring all routes are mounted on server startup.

---

## 5. Data, Cache & Job Workflows

### 5.1 Application & Key Generation

- Applications register to receive an `id` and `token`.
- Protected routes validate this token via Fastify guard (`x-app-token` or `Authorization: Bearer <token>`).

### 5.2 Account Creation & Async Hydration (BullMQ)

- When a user submits a ProxyScrape key via `POST /api/v1/proxy-accounts`:
  1. Create the `ProxyAccount` entity in SQLite with `status: 'inactive'`.
  2. Dispatch an `account-hydration` job to Redis via BullMQ.
  3. Return `202 Accepted` immediately with the account ID and `status: 'inactive'`.
  4. The BullMQ worker connects to ProxyScrape, fetches credentials and proxy list, persists `Proxy` entities, and flips the account status to `'active'`.

### 5.3 Proxy Leasing & Target-Scoped Ban Filtering

- When leasing a proxy for a `targetUrl`:
  1. Check Redis for an existing sticky session for `targetUrl` (domain-keyed).
  2. If miss or expired, query SQLite for healthy proxies belonging to the application's active accounts that have **NOT been marked as banned for that target URL** (`ProxyBan` table).
  3. Cache the assigned proxy in Redis with TTL (`cacheTime`, default: 60s).
  4. Return formatted proxy credentials.

### 5.4 Ban Reporting

- When a ban is reported (`POST /api/v1/proxies/ban`):
  1. Save a `ProxyBan` record in SQLite linking the proxy and `targetUrl`.
  2. Evict the Redis sticky session for that target URL so subsequent requests receive a non-banned IP.

---

## 6. Coding Rules & Constraints

- **Core Framework Packages (`#aegis/*`)**: All reusable framework foundation packages, base classes (including `Controller`, `Queue`, `Worker`, `Producer`), and future engine primitives are packages **developed in-house by ProxyGuard developers**. The package ecosystem is strictly named **`aegis`** (and ONLY `aegis`, similar to Laravel's `Illuminate`). They reside under `src/core/packages/` and are imported exclusively via `#aegis/*`. No other internal package names or aliases may be created.
- **Controller Base Class**: Every controller MUST extend `Controller` from `#aegis/controller/controller.js`.
- **One Controller per Feature**: Never create multiple controllers within a feature.
- **ESM Imports**: All relative TypeScript imports must include the `.js` extension (e.g., `import { Router } from '../routes/router.js';`).
- **Linter & Formatter**: Run `npm run lint` and `npm run format` after modifications.
- **Type Safety**: Avoid using `any`. Use TypeBox `Static<typeof ...>` and strongly-typed Fastify request/reply objects.

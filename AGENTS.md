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
│       ├── queue-scaffolder/
│       ├── exception-creator/
│       ├── postman-sync/
│       └── architecture-auditor/
├── src/
│   ├── main.ts                       # Fastify initialization & server start
│   ├── configs/                      # Application, database, and system configurations
│   ├── core/packages/                # Internal aegis framework packages developed by ProxyGuard devs (#aegis/*)
│   │   ├── http/
│   │   │   ├── controllers/
│   │   │   │   └── controller.ts     # Base abstract Controller class
│   │   │   ├── exceptions/
│   │   │   │   └── exception.ts      # Base abstract Exception class
│   │   │   └── index.ts
│   │   ├── database/
│   │   │   ├── entities/
│   │   │   │   └── BaseEntity.ts     # Base abstract BaseEntity class
│   │   │   └── index.ts
│   │   └── queues/
│   │       ├── queue.ts              # Base abstract Queue class
│   │       ├── queue.worker.ts       # Base abstract Worker class
│   │       ├── queue.producer.ts     # Base abstract Producer class
│   │       └── index.ts
│   ├── bootstrap/
│   │   └── app.ts                    # Bootstrap application & mount global router
│   ├── routes/
│   │   └── router.ts                 # Central /api/v1 router mounting feature plugins
│   ├── database/
│   │   ├── db.ts                     # MikroORM EntityManager export & helpers
│   │   ├── entities/                 # MikroORM entities (*.ts) extending BaseEntity (#aegis/database)
│   │   ├── migrations/               # MikroORM schema migration files
│   │   └── seeders/                  # MikroORM database seeders
│   ├── cache/
│   │   └── redis.ts                  # ioredis client singleton & sticky cache helpers
│   ├── exceptions/                   # Global common HTTP exceptions (BadRequestException, NotFoundException, etc.)
│   │   ├── index.ts
│   │   └── <name>.exception.ts
│   ├── jobs/
│   │   ├── index.ts                  # Central jobs registry & graceful shutdown
│   │   ├── constants.ts              # Central queue names dictionary (queue.<name>)
│   │   ├── interfaces/               # Job payload interfaces (*.interface.ts)
│   │   ├── producers/                # BullMQ Producer classes (*.producer.ts)
│   │   └── workers/                  # BullMQ Worker classes (*.worker.ts)
│   ├── shared/
│   │   ├── guards/                   # Fastify preHandler hooks (e.g. api-key.guard.ts)
│   │   └── interfaces/               # ONLY interfaces shared across multiple features
│   ├── storage/                      # SQLite database files and persistent storage
│   └── features/                     # Feature modules
│       └── <feature>/
│           ├── <feature>.routes.ts
│           ├── <feature>.schema.ts
│           ├── <feature>.controller.ts
│           ├── exceptions/           # OPTIONAL: Feature-scoped custom exceptions (e.g. ERR_TOKEN_EXPIRED)
│           │   ├── index.ts          # Barrel re-export if multiple exceptions
│           │   └── <name>.exception.ts
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

- **Mandatory Base Class**: Every controller **MUST extend the abstract `Controller` class** (`import { Controller } from '#aegis/http';`).
- **Exactly One Controller per Feature**: A feature must contain **only one** controller file (`<feature>.controller.ts`).
- **Pure Route Mapper**: The controller is directly a route mapper.
  - It contains **ZERO business logic**.
  - Each method in the controller represents a route mapped inside the feature itself.
  - It grabs data from the request (`request.body`, `request.params`, `request.query`, headers) and passes it down to the appropriate service (`service.handle(dto)` or `findService.findAll()` / `findService.findOne()`).
  - Sends the response and status code back to the client using `HttpStatusCode` from `axios` (`reply.status(HttpStatusCode.Created).send(...)`).
- **Method Naming Patterns**:
  - **CRUD Operations**: Methods handling standard CRUD operations MUST use standard names:
    - `findAll(request, reply)`
    - `findOne(request, reply)`
    - `create(request, reply)`
    - `update(request, reply)`
    - `delete(request, reply)`
  - **Action Routes**: Methods handling specific domain actions:
    - Use the direct action verb by default: e.g. `block(request, reply)`, `lease(request, reply)`.
    - When multiple related actions or targets exist within the same controller (e.g., blocking an account vs blocking a user), add explicit target precision: `blockAccount(request, reply)` and `blockUser(request, reply)`.
- **Status Code Standards**: Always use `HttpStatusCode` from `axios` (e.g. `HttpStatusCode.Created` for `create`, `HttpStatusCode.Ok` for reads/updates, `HttpStatusCode.NoContent` for deletes).
- **Thin & Simple Architecture**:
  - Keep controllers and services thin, simple, and readable without defensive bloat or over-engineering.
  - Direct `em` usage via `import { em } from '../../../database/db.js'` (`em.create(Entity, { ... })`, `await em.flush()`).
  - Plain text API secrets are generated as 64-character strings (`randomBytes(32).toString('hex')`) and must be hashed using `argon2` before database persistence.
  - Timestamps returned in API response schemas must be ISO 8601 formatted strings (`toISOString()`).
- Injects services via constructor and calls `super()`.
- Export both the class and a default instantiated singleton.

```typescript
import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller } from '#aegis/http';
import { HttpStatusCode } from 'axios';
import leaseProxyService, {
  LeaseProxyService,
} from './services/lease-proxy.service.js';
import { LeaseProxySchemaType } from './proxy.schema.js';

export class ProxyController extends Controller {
  constructor(private readonly leaseProxyService: LeaseProxyService) {
    super();
  }

  // Action route method directly maps to a route in proxy.routes.ts
  async lease(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as LeaseProxySchemaType;
    const response = await this.leaseProxyService.handle(body);
    reply.status(HttpStatusCode.Ok).send(response);
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

### 3.6 Background Job Architecture (Producers & Workers)

All asynchronous background tasks, queues, and workers are organized under `src/jobs/` and must strictly adhere to the following standards:

1. **Queue Names Constants (`src/jobs/constants.ts`)**:
   - All queue names must be defined in `src/jobs/constants.ts` within the `queue` object (e.g. `queue.syncSubaccountProxies = 'sync-subaccount-proxies'`).
   - Producers and workers import the queue name directly from `constants.ts` (`protected override queueName = queue.syncSubaccountProxies;`).
2. **Mandatory Base Classes**:
   - Every queue producer must extend `Producer<DataType, ResultType>` (`import { Producer } from '#aegis/queues/queue.producer.js'`).
   - Every queue worker must extend `Worker<DataType, ResultType>` (`import { Worker } from '#aegis/queues/queue.worker.js'`).
3. **Producer Requirements (`src/jobs/producers/<job>.producer.ts`)**:
   - Must specify `protected override queueName = queue.<name>`.
   - Must implement `dispatch(data: DataType, opts?: JobsOptions): Promise<Job<DataType, ResultType>>` using `this.queue.add(...)`.
   - Must export both the class and a default/instantiated singleton instance.
4. **Worker Requirements (`src/jobs/workers/<job>.worker.ts`)**:
   - Must specify matching `protected override queueName = queue.<name>`.
   - Can optionally override `protected override concurrency = <number>` (default: 5).
   - Must implement:
     - `execute(job: Job<DataType, ResultType>, token?: string): Promise<ResultType>` (the core processing logic).
     - `failed(job: Job<DataType, ResultType> | undefined, error: Error, prev?: string): Promise<void> | void` (failure handling and logging).
     - `success(job: Job<DataType, ResultType>, result: ResultType, prev?: string): Promise<void> | void` (success notifications/logging).
   - Workers automatically boot and connect on instantiation via the base class.
   - Must export both the class and an instantiated singleton.
5. **Job Interfaces (`src/jobs/interfaces/<job>.interface.ts`)**:
   - All job payload interfaces must be strongly typed and stored in `src/jobs/interfaces/` so both producers and consumers share the same contract.
6. **Central Registry & Graceful Shutdown (`src/jobs/index.ts`)**:
   - All active workers and producers must be registered in arrays (`workers`, `producers`) in `src/jobs/index.ts`.
   - Must export a `closeAllJobs()` function that closes workers first, then producers, to avoid dropping active jobs.
   - Hooked to Fastify's `onClose` hook in `src/bootstrap/app.ts`.

### 3.7 Database Entity Architecture (`BaseEntity`)

All database entities managed by MikroORM reside in `src/database/entities/`:

1. **Mandatory Base Class**:
   - Every entity MUST extend `BaseEntity` from `#aegis/database` (`import { BaseEntity } from '#aegis/database';`).
   - `BaseEntity` automatically manages:
     - `id`: Primary key using UUID v7 (`randomUUIDv7()`).
     - `createdAt`: Timestamp automatically generated on creation (`created_at`).
     - `updatedAt`: Timestamp automatically updated on update (`created_at`).
     - Composite index across `["id", "createdAt", "updatedAt"]`.
2. **Entity Location & Naming**:
   - All entities MUST live inside `src/database/entities/` (e.g. `ApiKey.ts`, `ProxyAccount.ts`).
   - Never place entity classes inside `src/features/`.
3. **Re-export in Index**:
   - All entities must be re-exported in `src/database/entities/index.ts` (`export * from './<Entity>.js';`).

```typescript
import { Entity, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '#aegis/database';

@Entity({ tableName: 'api_keys' })
export class ApiKey extends BaseEntity {
  @Property({ type: 'string' })
  secret!: string;
}
```

### 3.8 Exception Architecture (Global & Feature-Scoped Exceptions)

All HTTP and application exceptions in ProxyGuard inherit from the internal Aegis framework base `Exception` class (`#aegis/http`):

1. **Mandatory Base Class**:
   - Every exception MUST extend `Exception` from `#aegis/http` (`import { Exception } from '#aegis/http';`).
   - Base constructor signature: `constructor(errorCode: string, statusCode: number, message?: string)`.
   - Always use `HttpStatusCode` from `axios` for status codes.
   - Error code strings must follow uppercase screaming snake case (`ERR_<NAME>`).

2. **Global Common HTTP Exceptions (`src/exceptions/`)**:
   - Generic, feature-agnostic HTTP exceptions reside in `src/exceptions/` (e.g., `BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException`, `InternalServerErrorException`).
   - Use standard HTTP error codes: `ERR_BAD_REQUEST`, `ERR_NOT_FOUND`, `ERR_CONFLICT`, etc.
   - Every global exception is re-exported from `src/exceptions/index.ts`.

3. **Feature-Scoped Domain Exceptions (`src/features/<feature>/exceptions/`)**:
   - When a feature requires custom domain exceptions with dedicated error codes (e.g. `ERR_TOKEN_EXPIRED`, `ERR_PROXY_POOL_EXHAUSTED`, `ERR_ACCOUNT_INACTIVE`):
     - Create an `exceptions/` directory inside the feature: `src/features/<feature>/exceptions/`.
     - File naming: `<name>.exception.ts` (e.g. `token-expired.exception.ts`).
     - Class naming: `<Name>Exception` (e.g. `TokenExpiredException`).
     - Must extend `Exception` from `#aegis/http`.
     - Pass the custom error code, appropriate `HttpStatusCode` from `axios`, and an optional default or custom message.
     - If multiple exceptions exist in the feature, re-export them via `src/features/<feature>/exceptions/index.ts`.
     - Single-action services in that feature throw these exceptions directly when business or domain validation fails.
     - Never place generic HTTP exceptions into a feature's `exceptions/` directory, and never place feature-specific exceptions into `src/exceptions/`.

```typescript
// src/features/auth/exceptions/token-expired.exception.ts
import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class TokenExpiredException extends Exception {
  constructor(message: string = 'Token has expired') {
    super('ERR_TOKEN_EXPIRED', HttpStatusCode.Unauthorized, message);
  }
}
```

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

- **Core Framework Packages (`#aegis/*`)**: All reusable framework foundation packages, base classes (including `Controller`, `BaseEntity`, `Queue`, `Worker`, `Producer`), and future engine primitives are packages **developed in-house by ProxyGuard developers**. The package ecosystem is strictly named **`aegis`** (and ONLY `aegis`, similar to Laravel's `Illuminate`). They reside under `src/core/packages/` and are imported exclusively via `#aegis/*` (`#aegis/http`, `#aegis/database`, `#aegis/queues`). No other internal package names or aliases may be created.
- **Controller Base Class**: Every controller MUST extend `Controller` from `#aegis/http` (`import { Controller } from '#aegis/http';`).
- **Entity Base Class**: Every database entity MUST live inside `src/database/entities/` and MUST extend `BaseEntity` from `#aegis/database` (`import { BaseEntity } from '#aegis/database';`).
- **Producer & Worker Base Classes**: Every queue producer MUST extend `Producer` from `#aegis/queues` (`import { Producer } from '#aegis/queues';`), and every queue worker MUST extend `Worker` from `#aegis/queues` (`import { Worker } from '#aegis/queues';`).
- **Exception Base Class & Scoping**: Every custom or HTTP exception MUST extend `Exception` from `#aegis/http` (`import { Exception } from '#aegis/http';`). Generic HTTP exceptions live in `src/exceptions/`. Feature-scoped exceptions with custom error codes (e.g. `ERR_TOKEN_EXPIRED`) MUST live in `src/features/<feature>/exceptions/`.
- **One Controller per Feature**: Never create multiple controllers within a feature.
- **ESM Imports**: All relative TypeScript imports must include the `.js` extension (e.g., `import { Router } from '../routes/router.js';`).
- **Linter & Formatter**: Run `npm run lint` and `npm run format` after modifications.
- **Type Safety**: Avoid using `any`. Use TypeBox `Static<typeof ...>` and strongly-typed Fastify request/reply objects.
- **Postman Synchronization**: Every newly added endpoint MUST be added to `docs/postman/ProxyGuard.postman_collection.json`. Every removed endpoint MUST be deleted from the collection. Any environment variable that is no longer used or whose endpoint was deleted MUST be deleted from both local and production Postman environment files.

---

## 7. Postman Collection & Environment Synchronization Standards

All endpoints in ProxyGuard are cataloged, documented, and tested via the Postman collection and environment files in `docs/postman/`:

- `docs/postman/ProxyGuard.postman_collection.json`
- `docs/postman/ProxyGuard.postman_environment.json`
- `docs/postman/ProxyGuard.production.postman_environment.json`

Every AI coding agent MUST strictly enforce synchronization between the codebase routes and the Postman files:

### 7.1 When a New Endpoint is Added

1. Add the endpoint to `docs/postman/ProxyGuard.postman_collection.json` under its designated feature folder.
2. Configure:
   - Method (`GET`, `POST`, `PUT`, `DELETE`, etc.) and full parameterized URL (`{{baseUrl}}/api/v1/...`).
   - Headers: include `Content-Type: application/json`, `Accept: application/json`, and authentication headers (`api-key-id: {{apiKeyId}}`, `api-key-secret: {{apiKeySecret}}`) if guarded by `HasValidApiKeyGuard`.
   - Request body schema and realistic JSON payload (mode: `"raw"`, language: `"json"`).
   - Automated test scripts (`pm.test`) verifying status code, schema structure, and error cases.
   - Dynamic variable chaining: if the endpoint creates/returns identifiers (e.g., keys, tokens, session IDs), set them via `pm.environment.set(...)` and `pm.collectionVariables.set(...)`.
   - Sample responses (200/201 success and relevant 4xx/5xx error examples).
3. If the new endpoint introduces a new environment variable or configurable parameter, add it to both `ProxyGuard.postman_environment.json` and `ProxyGuard.production.postman_environment.json`.

### 7.2 When an Endpoint is Removed / Deleted

1. Remove the endpoint item and any associated test cases or example responses from `docs/postman/ProxyGuard.postman_collection.json`.
2. If an entire feature is deleted, remove its folder from the collection.
3. Check all variables referenced by the deleted endpoint: if a variable is not used by any other endpoint in the collection, delete it from both environment files.

### 7.3 Pruning Unused Environment Variables

1. If an environment variable in `ProxyGuard.postman_environment.json` or `ProxyGuard.production.postman_environment.json` is not referenced by any request URL, header, body, or test script in `ProxyGuard.postman_collection.json`, it is considered orphaned.
2. The agent MUST delete the unused variable from both environment files immediately.
3. Never allow dead or obsolete environment variables to linger.

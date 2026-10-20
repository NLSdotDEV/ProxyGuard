# Architecture Standards & Rules for ProxyGuard

These rules are strictly enforced across the entire ProxyGuard codebase. Coding agents must review every code generation against these rules.

---

## Rule 1: Mandatory Controller Inheritance & Single Controller Constraint

- **Every feature controller MUST extend the abstract `Controller` class**:
  ```typescript
  import { Controller } from '#aegis/http';

  export class FeatureController extends Controller {
    constructor(...) {
      super();
    }
  }
  ```
- **A feature MUST have EXACTLY ONE controller**: Never create multiple controllers within a single feature. All endpoints for that feature are handled by `<feature>.controller.ts`.

---

## Rule 2: Controller is Strictly a Direct Route Mapper

- **Zero Business Logic**: Controllers never perform calculations, direct database queries, or cache manipulations.
- **1:1 Route Mapping**: Every method on the controller corresponds directly to a route endpoint mapped in `<feature>.routes.ts`.
- **Pure Data Handoff**: The controller method extracts data from the request (`request.body`, `request.params`, `request.query`, headers), forwards it to the appropriate service (`service.handle(dto)` or `findService.findAll()` / `findService.findOne()`), and sends the response (`reply.status(...).send(...)`).

---

## Rule 3: Single-Action Services (Mandatory)

Except for `find-{feature}.service.ts` (when present), **every service class in `src/features/<feature>/services/` MUST be a single-action class containing ONLY ONE public method named `handle()`**:

```typescript
// ✅ CORRECT: Single action class with only handle()
export class LeaseProxyService {
  constructor(
    private readonly em: EntityManager,
    private readonly redis: Redis,
  ) {}

  async handle(dto: LeaseProxyDto): Promise<LeasedProxyResult> {
    // Single business action logic here
  }
}

// ❌ FORBIDDEN: Multi-action service
export class ProxyService {
  async lease() {}
  async ban() {}
  async sync() {}
}
```

---

## Rule 4: Query Service Scope (`find-*.service.ts`) is Optional

- **`find-<feature>.service.ts` is NOT mandatory for every feature**: If a feature is not CRUD and does not query lists or single items by ID (e.g. an auth feature with only login and signup), **do not create a find service**.
- **If a feature requires query operations**, implement `find-<feature>.service.ts`. It is the ONLY service permitted to have more than one method, and it must contain **ONLY TWO methods**:
  1. `findAll(...)`
  2. `findOne(id: string)`

---

## Rule 5: DTO and Interface Placement

- If a DTO or interface is used **only** by a single service, declare and export it directly within that service file:
  ```typescript
  // In src/features/proxy/services/lease-proxy.service.ts
  export interface LeaseProxyDto {
    targetUrl: string;
    cacheTime?: number;
  }
  ```
- If an interface is shared across multiple features or services, place it in `src/shared/interfaces/` (e.g. `src/shared/interfaces/pagination.interface.ts`).
- Never create a separate `dto/` folder inside a feature if the DTO is specific to a single service.

---

## Rule 6: Route Registration & Router Mounting

Route registration must follow this exact flow:

1. `<feature>.routes.ts` defines the endpoints with TypeBox schemas and calls the controller methods.
2. In `src/routes/router.ts`:
   - Import the feature routes: `import { <Feature>Routes } from '../features/<feature>/<feature>.routes.js';`
   - Register it inside the `routes` constant with its prefix:
     ```typescript
     const routes: FastifyPluginAsync = async (fastify, _opts) => {
       fastify.register(AppRoutes, { prefix: 'app' });
       fastify.register(<Feature>Routes, { prefix: '<feature>' });
     };
     ```
   - `Router.define(instance)` mounts `routes` under `api/v1`:
     ```typescript
     export class Router {
       static async define(instance: FastifyInstance) {
         const v1 = 'v1';
         const currentVersion = v1;
         instance.register(routes, { prefix: `api/${currentVersion}` });
       }
     }
     ```
3. `Router.define(server)` is called inside `boostrap(server)` in `src/bootstrap/app.ts`.

---

## Rule 7: Fastify 5 & TypeBox Type Provider

- All routes must define TypeBox schemas for validation.
- In `src/main.ts`, the server is configured with `.withTypeProvider<TypeBoxTypeProvider>()`.
- Always import `Type, { Static } from "typebox"`.
- Generate TypeScript types from schemas using `Static<typeof ...>`.

---

## Rule 8: ESM Imports Require `.js` Extension

TypeScript is configured for Node.js ESM (`"type": "module"`). All relative imports must explicitly include the `.js` extension:

```typescript
// ✅ CORRECT
import { Router } from '../routes/router.js';
import { AppSchema } from './app.schema.js';

// ❌ FORBIDDEN
import { Router } from '../routes/router';
```

---

## Rule 9: Internal Framework Packages — In-House Aegis Ecosystem (`#aegis/*`)

- **In-House Developed**: All core packages under `src/core/packages/` are proprietary framework packages **developed exclusively by ProxyGuard developers**.
- **Sole Package Name (`aegis`)**: The package ecosystem is strictly named **`aegis`** (and ONLY `aegis`, serving the same role as `Illuminate` does in Laravel). Never create or use any other package names or aliases for internal framework code.
- All framework foundations, base classes (including `Controller`, `Queue`, `Worker`, `Producer`), and engine primitives belong to `aegis` and are imported via Node native subpath imports (`#aegis/*`):
  ```typescript
  import { Controller } from '#aegis/controller/controller.js';
  import { Queue } from '#aegis/queues/queue.js';
  ```
- The `src/shared/` directory is reserved ONLY for cross-feature guards (`src/shared/guards/`) and shared interfaces (`src/shared/interfaces/`). The base controller and framework primitives live under `src/core/packages/` as part of `aegis`.

---

## Rule 10: Background Jobs & Queue Architecture (Producers & Workers)

All asynchronous background tasks, queues, and workers reside in `src/jobs/` and must adhere strictly to these architectural standards:

1. **Mandatory Aegis Base Classes**:
   - Every queue producer MUST extend `Producer<DataType, ResultType>` from `#aegis/queues/queue.producer.js`.
   - Every queue worker MUST extend `Worker<DataType, ResultType>` from `#aegis/queues/queue.worker.js`.
2. **Directory Structure**:
   - `src/jobs/interfaces/<job>.interface.ts`: Strongly-typed payload interface shared between producer and worker.
   - `src/jobs/queues/<job>.producer.ts`: Producer class setting `protected override queueName` and implementing `dispatch(...)`.
   - `src/jobs/workers/<job>.worker.ts`: Worker class setting matching `protected override queueName`, optional `concurrency`, and implementing `execute(job)`, `failed(job, error)`, and `success(job, result)`.
   - `src/jobs/index.ts`: Central registry collecting all active workers and producers.
3. **Graceful Shutdown**:
   - `src/jobs/index.ts` must export `closeAllJobs(): Promise<void>` closing workers first, then producers.
   - Must be mounted inside `boostrap(server)` in `src/bootstrap/app.ts` under `server.addHook('onClose', ...)`.
4. **Single-Action Service Dispatch**:
   - Single-action services dispatch jobs by invoking the singleton producer's `dispatch()` method.
   - Controller returns `202 Accepted` immediately upon job dispatch.

---

## Rule 11: Database Entities & BaseEntity Inheritance

All MikroORM database entities must adhere strictly to these architectural standards:

1. **Mandatory Base Class**:
   - Every entity MUST extend `BaseEntity` from `#aegis/database` (`import { BaseEntity } from '#aegis/database';`).
   - `BaseEntity` provides UUID v7 primary keys (`id: string`), auto-managed timestamps (`createdAt`, `updatedAt`), and composite indexing.
2. **Entity Location**:
   - All entity files MUST live directly inside `src/database/entities/` (e.g. `src/database/entities/ApiKey.ts`).
   - Entities must NEVER be declared inside `src/features/` or other subfolders.
3. **Barrel Re-export**:
   - Every entity must be exported in `src/database/entities/index.ts` (`export * from './<Entity>.js';`).
4. **Example Entity Definition**:
   ```typescript
   import { Entity, Property } from '@mikro-orm/decorators/es';
   import { BaseEntity } from '#aegis/database';

   @Entity({ tableName: 'api_keys' })
   export class ApiKey extends BaseEntity {
     @Property({ type: 'string' })
     secret!: string;
   }
   ```

> [!NOTE]
> **Why "Aegis"? (Greek Mythology Context)**
> In Greek mythology, the **Aegis** (αἰγίς) is the impenetrable shield or garment borne by Zeus and wielded by Athena, goddess of wisdom, intellect, and battle strategy. It provided total protection against harm and struck intimidation into threats. We chose **Aegis** because it serves as the ultimate defensive shield for ProxyGuard: deflecting anti-bot bans, insulating core logic from proxy volatility, and enforcing disciplined, single-action architectural wisdom.

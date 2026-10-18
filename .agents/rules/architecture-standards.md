# Architecture Standards & Rules for ProxyGuard

These rules are strictly enforced across the entire ProxyGuard codebase. Coding agents must review every code generation against these rules.

---

## Rule 1: Mandatory Controller Inheritance & Single Controller Constraint

- **Every feature controller MUST extend the abstract `Controller` class**:
  ```typescript
  import { Controller } from '../../shared/controllers/controller.js';

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

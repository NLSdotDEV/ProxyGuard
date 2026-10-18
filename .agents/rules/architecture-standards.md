# Architecture Standards & Rules for ProxyGuard

These rules are strictly enforced across the entire ProxyGuard codebase. Coding agents must review every code generation against these rules.

---

## Rule 1: Single-Action Services (Mandatory)

Except for `find-{feature}.service.ts`, **every service class in `src/features/<feature>/services/` MUST be a single-action class containing ONLY ONE public method named `handle()`**:

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

## Rule 2: Query Service Scope (`find-*.service.ts`)

The query service `src/features/<feature>/services/find-<feature>.service.ts` is the ONLY service permitted to have more than one method, and it must contain **ONLY TWO methods**:

1. `findAll(...)`
2. `findOne(id: string)`

```typescript
// ✅ CORRECT
export class FindProxyService {
  constructor(private readonly em: EntityManager) {}
  async findAll(appId: string): Promise<ProxyEntity[]> { ... }
  async findOne(id: string): Promise<ProxyEntity | null> { ... }
}

// ❌ FORBIDDEN: Adding custom query methods or action methods
export class FindProxyService {
  async findAll() {}
  async findOne() {}
  async findByIp() {} // FORBIDDEN: Create a single-action service or filter inside findAll
  async deleteOne() {} // FORBIDDEN: Create delete-proxy.service.ts
}
```

---

## Rule 3: DTO and Interface Placement

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

## Rule 4: Controllers Must Be Thin

Controllers in `src/features/<feature>/<feature>.controller.ts` must contain **ZERO business logic**:

- Extract request params, query, or body.
- Call `service.handle(dto)` or `findService.findAll()` / `findService.findOne()`.
- Send reply with appropriate HTTP status code (`200`, `201`, `202`, etc.).

---

## Rule 5: Fastify 5 & TypeBox Type Provider

- All routes must define TypeBox schemas for validation.
- In `src/main.ts`, the server is configured with `.withTypeProvider<TypeBoxTypeProvider>()`.
- Always import `Type, { Static } from "typebox"`.
- Generate TypeScript types from schemas using `Static<typeof ...>`.

---

## Rule 6: ESM Imports Require `.js` Extension

TypeScript is configured for Node.js ESM (`"type": "module"`). All relative imports must explicitly include the `.js` extension:

```typescript
// ✅ CORRECT
import { Router } from '../routes/router.js';
import { AppSchema } from './app.schema.js';

// ❌ FORBIDDEN
import { Router } from '../routes/router';
```

---

## Rule 7: Asynchronous Account Hydration via BullMQ

- Any ProxyScrape account created via `POST /api/v1/proxy-accounts` must be saved with initial status `'inactive'`.
- A background job must be dispatched to BullMQ (`account-hydration`).
- Only the background worker may update the account status to `'active'` after persisting its proxies.

---

## Rule 8: Target-Scoped Ban Filtering

- Bans must be checked against the target domain/URL for each proxy lease.
- Do not blindly lease a proxy that has an active `ProxyBan` for the requested target connection.

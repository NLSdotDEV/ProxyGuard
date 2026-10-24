---
name: service-creator
description: >-
  Guides creating new services in ProxyGuard following the strict Single-Action Service or Find-Service pattern.
  Use this skill whenever adding, refactoring, or defining a service class in src/features/<feature>/services/.
---

# Service Creator Skill

This skill enforces ProxyGuard's core service rules:

1. **`find-<feature>.service.ts` is OPTIONAL**: Only features requiring read/query operations (CRUD features listing items or finding by ID) need a find service. If a feature does not query collections (e.g. an auth feature with only login/signup), omit the find service.
2. If `find-<feature>.service.ts` is present, it is the ONLY multi-method service permitted, and it has **strictly two methods**: `findAll()` and `findOne(id)`.
3. **All other services** must be **Single-Action Classes** with **exactly one public method**: `handle(dto)`.

---

## When to Use Which Pattern

```text
Are you adding a service in src/features/<feature>/services/?
  │
  ├── Is it querying a list of items or an item by ID?
  │     └── YES ➔ Update or create `find-<feature>.service.ts`
  │               Methods: ONLY findAll(filter) and findOne(id)
  │
  └── Is it performing any other action (create, update, delete, lease, ban, sync, login, check)?
        └── YES ➔ Create a new Single-Action Service:
                  `<action>-<feature>.service.ts`
                  Method: ONLY `handle(dto: ActionDto): Promise<Result>`
```

---

## Rules for Single-Action Services

1. **File Naming**: `<action>-<feature>.service.ts` (e.g. `lease-proxy.service.ts`, `report-ban.service.ts`, `sync-account.service.ts`, `login-auth.service.ts`).
2. **Method Signature**: Exactly one public method named `handle`:
   ```typescript
   async handle(dto: ActionDto): Promise<ActionResult>
   ```
3. **No Secondary Actions**: If the operation requires multiple distinct tasks, delegate to other single-action services or internal private helper functions. Never expose additional public methods on the service class.
4. **DTO Placement**:
   - Single-use DTO/interface: Declare and export in the service file.
   - Cross-feature shared interface: Import from `src/shared/interfaces/`.
5. **Thin and Simple Implementation**:
   - Keep services lean, thin, and focused. Avoid over-engineering, verbose abstraction cascades, or unnecessary layers.
   - For database operations, use direct `em` from `src/database/db.js` (`em.create(Entity, { ... })`, `await em.flush()`).
   - When generating credentials/secrets, generate 64-character hex strings (`randomBytes(32).toString('hex')`) and hash with `argon2` before saving to the database.
   - Format entity timestamps returned in DTOs as ISO 8601 strings (`toISOString()`).
6. **Constructor Injection**: Inject dependencies (MikroORM `EntityManager`, Redis `Redis`, BullMQ `Queue`, or internal `#aegis/*` framework abstractions) through the constructor when needed, or rely on clean direct imports. All internal framework classes belong exclusively to the in-house `aegis` ecosystem.
7. **Postman Synchronization**: When a service creates or alters an endpoint route, immediately update `docs/postman/ProxyGuard.postman_collection.json`. When an endpoint is removed, delete it from the collection and prune unused environment variables from `docs/postman/*.postman_environment.json`.

---

## Reference Patterns

Read [service-patterns.md](./references/service-patterns.md) for concrete examples of:

- Database single-action services (MikroORM)
- Redis cached single-action services (ioredis)
- BullMQ queuing single-action services
- Query service (`find-*.service.ts`)

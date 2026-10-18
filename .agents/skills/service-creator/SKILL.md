---
name: service-creator
description: >-
  Guides creating new services in ProxyGuard following the strict Single-Action Service or Find-Service pattern.
  Use this skill whenever adding, refactoring, or defining a service class in src/features/<feature>/services/.
---

# Service Creator Skill

This skill enforces ProxyGuard's core service rule:

1. **`find-<feature>.service.ts`** is the ONLY multi-method service, and it has **strictly two methods**: `findAll()` and `findOne(id)`.
2. **All other services** must be **Single-Action Classes** with **exactly one public method**: `handle(dto)`.

---

## When to Use Which Pattern

```text
Are you adding a service in src/features/<feature>/services/?
  │
  ├── Is it querying a list of items or an item by ID?
  │     └── YES ➔ Update or use `find-<feature>.service.ts`
  │               Methods: findAll(filter), findOne(id)
  │
  └── Is it performing any other action (create, update, delete, lease, ban, sync, check)?
        └── YES ➔ Create a new Single-Action Service:
                  `<action>-<feature>.service.ts`
                  Method: ONLY `handle(dto: ActionDto): Promise<Result>`
```

---

## Rules for Single-Action Services

1. **File Naming**: `<action>-<feature>.service.ts` (e.g. `lease-proxy.service.ts`, `report-ban.service.ts`, `sync-account.service.ts`).
2. **Method Signature**: Exactly one public method named `handle`:
   ```typescript
   async handle(dto: ActionDto): Promise<ActionResult>
   ```
3. **No Secondary Actions**: If the operation requires multiple distinct tasks, delegate to other single-action services or internal private helper functions. Never expose additional public methods on the service class.
4. **DTO Placement**:
   - Single-use DTO/interface: Declare and export in the service file.
   - Cross-feature shared interface: Import from `src/shared/interfaces/`.
5. **Constructor Injection**: Inject dependencies (MikroORM `EntityManager`, Redis `Redis`, BullMQ `Queue`) through the constructor.

---

## Reference Patterns

Read [service-patterns.md](./references/service-patterns.md) for concrete examples of:

- Database single-action services (MikroORM)
- Redis cached single-action services (ioredis)
- BullMQ queuing single-action services
- Query service (`find-*.service.ts`)

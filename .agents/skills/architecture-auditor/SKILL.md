---
name: architecture-auditor
description: >-
  Audits the ProxyGuard codebase or proposed PRs/changes to ensure 100% compliance with architectural rules.
  Use this skill whenever asked to check, audit, review, or validate code against ProxyGuard's architecture rules.
---

# Architecture Auditor Skill

This skill provides an automated audit procedure to verify that all code in ProxyGuard conforms strictly to the project rules and standards.

---

## When to Run This Audit

- Before finishing any code generation or refactoring task.
- When reviewing a PR, commit, or newly generated feature.
- When the user asks: "Check if this follows our architecture", "Audit the services", or "Verify conventions".

---

## Audit Workflow

### Step 1: Scan Services in `src/features/*/services/`

Check every `.service.ts` file:

1. Is the file named `find-*.service.ts`?
   - Verify it is only present in CRUD features that actually query items.
   - Verify it contains **ONLY** `findAll(...)` and `findOne(...)`.
   - Flag any other method as an **Architecture Violation**.
2. Is the file named `<action>-*.service.ts`?
   - Verify it contains **EXACTLY ONE public method named `handle()`**.
   - Flag any other public method as an **Architecture Violation**.
3. Check DTO exports:
   - If a DTO is specific to that service, ensure it is declared in the service file.
   - If an interface is shared, ensure it is imported from `src/shared/interfaces/`.

### Step 2: Scan Controllers in `src/features/*/*.controller.ts`

1. **Inheritance Check**: Verify that every controller extends `Controller` from `#aegis/controller/controller.js`.
2. **Single Controller Check**: Verify that each feature directory contains **EXACTLY ONE** controller file (`<feature>.controller.ts`).
3. **Route Mapper Check**: Verify that methods map 1:1 to endpoints in `<feature>.routes.ts`. Methods must only extract request data, call `service.handle()` or `findService.findAll()/findOne()`, and call `reply.send()`.
4. Flag any database queries, Redis calls, or direct business calculations in controllers as **Architecture Violations**.

### Step 3: Scan Routes and Schemas

1. Verify that every route has a TypeBox schema attached.
2. Verify that schemas use `Type.Object(...)` from `typebox` and export `Static<typeof ...>` types.
3. Verify that the route plugin is registered in `src/routes/router.ts` inside `const routes`.

### Step 4: Scan Imports and Types

1. Verify that all relative imports end with `.js` (e.g. `import ... from './service.js'`).
2. **Internal Framework Package Check**: Verify that all internal framework components and base classes are imported strictly via `#aegis/*` (e.g. `#aegis/controller/controller.js`). `aegis` is the ONLY internal package ecosystem developed by ProxyGuard developers. Flag any `@core`, `@guard`, or arbitrary alias as an **Architecture Violation**.
3. Run TypeScript build: `npm run build`.
4. Run linter: `npm run lint`.

### Step 5: Scan Background Jobs & Queues in `src/jobs/`

1. **Producer Inheritance**: Verify that all producers in `src/jobs/queues/*.producer.ts` extend `Producer` from `#aegis/queues/queue.producer.js` and implement `dispatch()`.
2. **Worker Inheritance**: Verify that all workers in `src/jobs/workers/*.worker.ts` extend `Worker` from `#aegis/queues/queue.worker.js` and implement `execute()`, `failed()`, and `success()`.
3. **Queue Name Consistency**: Verify that producer and worker matching a job share the exact same `queueName`.
4. **Interface Contract**: Verify that job payloads are strongly typed in `src/jobs/interfaces/*.interface.ts` (no `any`).
5. **Registry & Shutdown**: Verify that workers and producers are listed in `src/jobs/index.ts` and that `closeAllJobs()` is hooked into Fastify's `onClose`.

---

## Detailed Audit Checklist

Read [checklist.md](./references/checklist.md) for the complete violation criteria and remediation guide.

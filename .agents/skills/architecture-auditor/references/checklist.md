# Architecture Auditor Checklist

Use this checklist to perform code reviews and audits on any file or pull request in ProxyGuard.

---

## 1. Services Audit

| Check                         | Requirement                                                                                                                     | Severity    | Action if Violated                                                                          |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------ | :---------- | :------------------------------------------------------------------------------------------ |
| **Action Service Purity**     | `<action>-<feature>.service.ts` has **ONLY** `handle()` public method.                                                          | 🔴 Critical | Refactor additional public methods into private helpers or separate single-action services. |
| **Query Service Purity**      | `find-<feature>.service.ts` has **ONLY** `findAll()` and `findOne()`.                                                           | 🔴 Critical | Move custom queries or mutations out of `find-*.service.ts` into single-action services.    |
| **Find Service Necessity**    | `find-*.service.ts` should only exist if the feature has CRUD/queries. Non-CRUD features (e.g. auth login/signup) must omit it. | 🟡 Warning  | Remove unnecessary find services from non-CRUD features.                                    |
| **Local DTO Scope**           | Single-use DTO declared and exported directly in the service file.                                                              | 🟡 Warning  | Move single-use DTO from global/feature folders into the service file.                      |
| **Shared Interface Location** | Reused interfaces stored under `src/shared/interfaces/`.                                                                        | 🟡 Warning  | Extract shared interface to `src/shared/interfaces/<name>.interface.ts`.                    |
| **Dependency Injection**      | Dependencies injected via constructor (`EntityManager`, `Redis`, `Queue`).                                                      | 🟡 Warning  | Remove global direct state calls; pass dependencies into constructor.                       |

---

## 2. Controllers Audit

| Check                    | Requirement                                                                                                                     | Severity    | Action if Violated                                                                    |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------ | :---------- | :------------------------------------------------------------------------------------ |
| **Mandatory Base Class** | Controller extends `Controller` (`import { Controller } from '#aegis/http'`).                                                   | 🔴 Critical | Make the controller class extend `Controller` and invoke `super()`.                   |
| **Single Controller**    | A feature contains **EXACTLY ONE** controller (`<feature>.controller.ts`).                                                      | 🔴 Critical | Consolidate multiple controllers into the single feature controller.                  |
| **Direct Route Mapper**  | Controller methods map 1:1 to routes, extracting data and passing directly to services.                                         | 🔴 Critical | Remove any inline calculations, DB calls, or Redis access; move logic into a service. |
| **CRUD Method Naming**   | CRUD controller methods MUST use: `findAll`, `findOne`, `create`, `update`, `delete`.                                           | 🔴 Critical | Rename non-standard CRUD methods (e.g. `getAll` -> `findAll`, `getOne` -> `findOne`). |
| **Action Method Naming** | Action methods use concise verbs (`block`, `lease`) or disambiguated names (`blockAccount`, `blockUser` when precision needed). | 🟡 Warning  | Rename ambiguous action methods to clear action verbs.                                |
| **Typed Requests**       | Uses `request.body as SomeType` or Fastify typed route generics.                                                                | 🟡 Warning  | Cast or type request body/params using TypeBox `Static` types.                        |
| **HttpStatusCode Enum**  | Responses use `HttpStatusCode` from `axios` (`HttpStatusCode.Created`, `HttpStatusCode.Ok`, etc.).                              | 🟢 Notice   | Replace magic number status codes with `HttpStatusCode.<Status>`.                     |

---

## 3. Schemas & Routes Audit

| Check                   | Requirement                                                                           | Severity    | Action if Violated                                                              |
| :---------------------- | :------------------------------------------------------------------------------------ | :---------- | :------------------------------------------------------------------------------ |
| **TypeBox Everywhere**  | Uses TypeBox (`Type.Object(...)`) for all routes.                                     | 🔴 Critical | Replace inline objects or unvalidated routes with TypeBox schemas.              |
| **Router Mounting**     | All feature route plugins registered in `src/routes/router.ts` inside `const routes`. | 🔴 Critical | Ensure `fastify.register(<Feature>Routes, { prefix: '<feature>' })` is present. |
| **Response Validation** | Routes declare response schemas where practical to optimize Fastify serialization.    | 🟢 Notice   | Add `response: { 200: ... }` to route schema.                                   |

---

## 4. Code Hygiene Audit

| Check                    | Requirement                                                                                                                          | Command to Verify |
| :----------------------- | :----------------------------------------------------------------------------------------------------------------------------------- | :---------------- |
| **Aegis Exclusivity**    | All internal framework foundations imported from `#aegis/*`. `aegis` is the ONLY internal package name developed by ProxyGuard devs. | `npm run build`   |
| **ESM `.js` Extensions** | All relative imports end with `.js`.                                                                                                 | `npm run build`   |
| **TypeScript Typing**    | Zero type errors.                                                                                                                    | `npm run build`   |
| **Linter Checks**        | Passes ESLint flat config.                                                                                                           | `npm run lint`    |
| **Prettier Formatting**  | Adheres to `.prettierrc`.                                                                                                            | `npm run format`  |

---

## 5. Queues, Workers & Producers Audit

| Check                         | Requirement                                                                                                    | Severity    | Action if Violated                                                                |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------- | :---------- | :-------------------------------------------------------------------------------- |
| **Producer Inheritance**      | Extends `Producer` (`import { Producer } from '#aegis/queues/queue.producer.js'`).                             | 🔴 Critical | Make producer class extend `Producer<DataType>` and invoke `super()`.             |
| **Worker Inheritance**        | Extends `Worker` (`import { Worker } from '#aegis/queues/queue.worker.js'`).                                   | 🔴 Critical | Make worker class extend `Worker<DataType>` and invoke `super()`.                 |
| **Queue Name Consistency**    | Producer and matching Worker must specify the identical `queueName` string.                                    | 🔴 Critical | Fix `queueName` mismatch so jobs are not orphaned in Redis.                       |
| **Worker Method Purity**      | Worker must implement `execute()`, `failed()`, and `success()`.                                                | 🔴 Critical | Add missing handlers to ensure full lifecycle monitoring.                         |
| **Strongly Typed Payloads**   | Job payload interfaces declared in `src/jobs/interfaces/` with no `any`.                                       | 🟡 Warning  | Replace `any` with strongly typed interfaces.                                     |
| **Graceful Shutdown Mounted** | Registered in `src/jobs/index.ts` and `closeAllJobs()` invoked in `src/bootstrap/app.ts` on Fastify `onClose`. | 🟡 Warning  | Ensure workers and producers are registered and closed gracefully to avoid leaks. |

---

## 6. Database Entities Audit

| Check                       | Requirement                                                                                     | Severity    | Action if Violated                                                                         |
| :-------------------------- | :---------------------------------------------------------------------------------------------- | :---------- | :----------------------------------------------------------------------------------------- |
| **BaseEntity Inheritance**  | Every entity MUST extend `BaseEntity` (`import { BaseEntity } from '#aegis/database';`).        | 🔴 Critical | Make entity class extend `BaseEntity` from `#aegis/database`.                              |
| **Entity Directory Scope**  | Entities must live directly in `src/database/entities/`. Never in features.                     | 🔴 Critical | Move misplaced entity into `src/database/entities/`.                                       |
| **Barrel Export in Index**  | All entities exported in `src/database/entities/index.ts`.                                      | 🟡 Warning  | Add `export * from './<Entity>.js';` to `src/database/entities/index.ts`.                  |
| **UUID Primary Key & Time** | Rely on `BaseEntity` for `id`, `createdAt`, `updatedAt`; do not redeclare them on child entity. | 🟡 Warning  | Remove duplicate primary key and timestamp properties; inherit directly from `BaseEntity`. |

---

## 7. Exceptions Audit

| Check                         | Requirement                                                                                                      | Severity    | Action if Violated                                                                              |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------- | :---------- | :---------------------------------------------------------------------------------------------- |
| **Exception Base Class**      | Every exception MUST extend `Exception` from `#aegis/http` (`import { Exception } from '#aegis/http';`).         | 🔴 Critical | Make exception class extend `Exception` from `#aegis/http` and call `super(code, status, msg)`. |
| **Feature Scoping**           | Feature-specific domain exceptions (e.g. `ERR_TOKEN_EXPIRED`) must live in `src/features/<feature>/exceptions/`. | 🔴 Critical | Move feature-specific exception to `src/features/<feature>/exceptions/`.                        |
| **Global HTTP Scope**         | Generic HTTP exceptions (`NotFoundException`, `ConflictException`, etc.) must live in `src/exceptions/`.         | 🔴 Critical | Move generic exception to `src/exceptions/`.                                                    |
| **HttpStatusCode Enum**       | Exception passes `HttpStatusCode` from `axios` (never a magic number literal).                                   | 🟡 Warning  | Replace numeric status code with `HttpStatusCode.<Name>`.                                       |
| **Error Code Format**         | `errorCode` must follow screaming snake case: `ERR_<NAME>`.                                                      | 🟡 Warning  | Rename error code to match `ERR_<NAME>` convention.                                             |
| **Barrel Export Consistency** | Re-exported from `src/exceptions/index.ts` (or feature `exceptions/index.ts` if multiple).                       | 🟢 Notice   | Add barrel re-export statement.                                                                 |

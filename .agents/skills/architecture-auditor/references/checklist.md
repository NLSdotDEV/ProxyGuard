# Architecture Auditor Checklist

Use this checklist to perform code reviews and audits on any file or pull request in ProxyGuard.

---

## 1. Services Audit

| Check                         | Requirement                                                                | Severity    | Action if Violated                                                                          |
| :---------------------------- | :------------------------------------------------------------------------- | :---------- | :------------------------------------------------------------------------------------------ |
| **Action Service Purity**     | `<action>-<feature>.service.ts` has **ONLY** `handle()` public method.     | 🔴 Critical | Refactor additional public methods into private helpers or separate single-action services. |
| **Query Service Purity**      | `find-<feature>.service.ts` has **ONLY** `findAll()` and `findOne()`.      | 🔴 Critical | Move custom queries or mutations out of `find-*.service.ts` into single-action services.    |
| **Local DTO Scope**           | Single-use DTO declared and exported directly in the service file.         | 🟡 Warning  | Move single-use DTO from global/feature folders into the service file.                      |
| **Shared Interface Location** | Reused interfaces stored under `src/shared/interfaces/`.                   | 🟡 Warning  | Extract shared interface to `src/shared/interfaces/<name>.interface.ts`.                    |
| **Dependency Injection**      | Dependencies injected via constructor (`EntityManager`, `Redis`, `Queue`). | 🟡 Warning  | Remove global direct state calls; pass dependencies into constructor.                       |

---

## 2. Controllers Audit

| Check                  | Requirement                                                                               | Severity    | Action if Violated                                               |
| :--------------------- | :---------------------------------------------------------------------------------------- | :---------- | :--------------------------------------------------------------- |
| **No Business Logic**  | Controller does not execute SQL, Redis commands, or business calculations.                | 🔴 Critical | Move all logic into the corresponding `service.handle()` method. |
| **Typed Requests**     | Uses `request.body as SomeType` or Fastify typed route generics.                          | 🟡 Warning  | Cast or type request body/params using TypeBox `Static` types.   |
| **Proper HTTP Status** | Returns appropriate status codes: `201` for created, `202` for queued jobs, `200` for OK. | 🟢 Notice   | Align status codes with REST conventions.                        |

---

## 3. Schemas & Routes Audit

| Check                   | Requirement                                                                        | Severity    | Action if Violated                                                              |
| :---------------------- | :--------------------------------------------------------------------------------- | :---------- | :------------------------------------------------------------------------------ |
| **TypeBox Everywhere**  | Uses TypeBox (`Type.Object(...)`) for all routes.                                  | 🔴 Critical | Replace inline objects or unvalidated routes with TypeBox schemas.              |
| **Router Mounting**     | All feature route plugins mounted in `src/routes/router.ts`.                       | 🔴 Critical | Ensure `fastify.register(<Feature>Routes, { prefix: '<feature>' })` is present. |
| **Response Validation** | Routes declare response schemas where practical to optimize Fastify serialization. | 🟢 Notice   | Add `response: { 200: ... }` to route schema.                                   |

---

## 4. Code Hygiene Audit

| Check                    | Requirement                          | Command to Verify |
| :----------------------- | :----------------------------------- | :---------------- |
| **ESM `.js` Extensions** | All relative imports end with `.js`. | `npm run build`   |
| **TypeScript Typing**    | Zero type errors.                    | `npm run build`   |
| **Linter Checks**        | Passes ESLint flat config.           | `npm run lint`    |
| **Prettier Formatting**  | Adheres to `.prettierrc`.            | `npm run format`  |

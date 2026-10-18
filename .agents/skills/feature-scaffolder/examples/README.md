# Feature Scaffolding Reference Snapshot

This directory contains a complete, working reference snapshot of a ProxyGuard feature module and router registration. Use this as the canonical pattern when generating new features.

---

## Snapshot Contents

1. **`app-feature/app.schema.ts`**:
   - TypeBox schemas for request body, params, query, and response.
   - Grouped export (`export const AppSchema = { ... }`).
   - Static type exports using `Static<typeof ...>`.

2. **`app-feature/services/get-hello.service.ts`**:
   - Single-Action Service with **only** `async handle(dto: GetHelloDto): Promise<GetHelloResult>`.
   - Single-use DTO declared and exported directly from this service file.

3. **`app-feature/services/find-app.service.ts`**:
   - Optional query service with **strictly two methods**: `findAll()` and `findOne(id)`.
   - Omitted for non-CRUD features (e.g. auth login/signup).

4. **`app-feature/app.controller.ts`**:
   - **Mandatory Base Class**: Extends `Controller` from `src/shared/controllers/controller.js`.
   - **Single Controller**: Exactly one controller per feature module.
   - **Direct Route Mapper**: 1:1 mapping between methods and routes in `app.routes.ts`. Zero business logic. Grabs input, forwards to service, and returns `reply.status(code).send(result)`.

5. **`app-feature/app.routes.ts`**:
   - Fastify plugin exporting `AppRoutes: FastifyPluginAsync`.
   - Binds TypeBox schemas to endpoints and delegates to controller methods.

6. **`router.example.ts`**:
   - Registers feature route plugins inside the `routes` constant with `{ prefix: '<feature>' }`.
   - `Router.define()` registers `routes` with prefix `api/v1`.

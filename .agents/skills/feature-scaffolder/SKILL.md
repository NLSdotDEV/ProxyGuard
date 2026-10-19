---
name: feature-scaffolder
description: >-
  Scaffolds a new feature module in src/features/ strictly adhering to the ProxyGuard architecture standards.
  Use this skill whenever the user asks to create, scaffold, add, or generate a new feature module.
---

# Feature Scaffolder Skill

This skill guides the agent in scaffolding a new feature in `src/features/<feature>/` adhering to ProxyGuard's Fastify 5, TypeBox, and Single-Action Service architecture.

---

## Directory Structure of a Feature

Every feature directory must follow this exact layout:

```text
src/features/<feature>/
├── <feature>.routes.ts              # FastifyPluginAsync with schema validation
├── <feature>.schema.ts              # TypeBox schemas and Static types
├── <feature>.controller.ts          # EXACTLY ONE controller, extends Controller base class
└── services/
    ├── find-<feature>.service.ts    # OPTIONAL: ONLY if feature has CRUD/queries (findAll, findOne)
    └── <action>-<feature>.service.ts # Single-action classes with only handle(dto)
```

---

## Step-by-Step Scaffolding Procedure

### Step 1: Create Schemas (`<feature>.schema.ts`)

1. Import `Type, { Static } from "typebox"`.
2. Define request body, query, params, and response schemas using `Type.Object(...)`.
3. Export an object grouping the schemas (e.g., `export const <Feature>Schema = { ... }`).
4. Export static types using `export type <Name>Type = Static<typeof ...>`.

### Step 2: Determine if Query Service is Needed (`services/find-<feature>.service.ts`)

1. **Is the feature performing read/query operations (listing items or fetching by ID)?**
   - **YES** ➔ Create `services/find-<feature>.service.ts`.
     - Implement **ONLY** these two methods:
       - `async findAll(filter?: any)`
       - `async findOne(id: string)`
   - **NO** (e.g. auth login/signup, command-only features) ➔ **DO NOT create a find service**.

### Step 3: Create Single-Action Services (`services/<action>-<feature>.service.ts`)

For every other operation (e.g., create, update, delete, lease, ban, sync):

1. **STRICT RULE**: The service must contain **EXACTLY ONE public method named `handle()`**.
2. If the DTO or payload interface is specific to this service, declare and export it directly in the service file.
3. If the interface is shared across features, import it from `src/shared/interfaces/`.
4. Inject necessary dependencies (MikroORM `EntityManager`, Redis `Redis`, BullMQ `Queue`) in the constructor.

### Step 4: Create the Controller (`<feature>.controller.ts`)

1. **Mandatory Inheritance**: Must extend `Controller` from `#aegis/controller/controller.js` (from `aegis`, the in-house core framework package ecosystem developed by ProxyGuard devs).
2. **Exactly One Controller**: Only one controller file per feature.
3. **Pure Route Mapper**: Contains zero business logic. Each method corresponds 1:1 to an endpoint in `<feature>.routes.ts`.
4. Extracts request input (`request.body`, `params`, `query`), forwards it directly to the designated service (`service.handle(dto)` or `findService.findAll()`), and sends `reply.status(...).send(...)`.
5. Export both the class and a default instantiated singleton.

### Step 5: Create the Routes Plugin (`<feature>.routes.ts`)

1. Export a `FastifyPluginAsync` function named `<Feature>Routes`.
2. Register endpoints with full TypeBox schemas.
3. Handlers simply delegate directly to the controller: `async (request, reply) => await <feature>Controller.<method>(request, reply)`.

### Step 6: Register in Global Router (`src/routes/router.ts`)

1. Import `<Feature>Routes` in `src/routes/router.ts`.
2. Register the plugin inside the `routes` constant with its prefix:
   ```typescript
   const routes: FastifyPluginAsync = async (fastify, _opts) => {
     fastify.register(AppRoutes, { prefix: 'app' });
     fastify.register(<Feature>Routes, { prefix: '<feature>' });
   };
   ```
3. The `Router.define()` method registers `routes` with `api/v1`, and is mounted via `boostrap()` in `src/bootstrap/app.ts`.

---

## Reference Templates

Read [templates.md](./references/templates.md) for complete code templates for schemas, routes, controllers, and services.

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
├── <feature>.controller.ts          # Controller delegating to services
└── services/
    ├── find-<feature>.service.ts    # ONLY findAll and findOne(id)
    └── <action>-<feature>.service.ts # Single-action class with only handle(dto)
```

---

## Step-by-Step Scaffolding Procedure

### Step 1: Create Schemas (`<feature>.schema.ts`)

1. Import `Type, { Static } from "typebox"`.
2. Define request body, query, params, and response schemas using `Type.Object(...)`.
3. Export an object grouping the schemas (e.g., `export const <Feature>Schema = { ... }`).
4. Export static types using `export type <Name>Type = Static<typeof ...>`.

### Step 2: Create the Query Service (`services/find-<feature>.service.ts`)

1. Define class `Find<Feature>Service`.
2. **STRICT RULE**: Implement **ONLY** these two methods:
   - `async findAll(filter?: any)`
   - `async findOne(id: string)`
3. Export the class and a default instance.

### Step 3: Create Single-Action Services (`services/<action>-<feature>.service.ts`)

For every other operation (e.g., create, update, delete, lease, ban, sync):

1. **STRICT RULE**: The service must contain **EXACTLY ONE public method named `handle()`**.
2. If the DTO or payload interface is specific to this service, declare and export it directly in the service file.
3. If the interface is shared across features, import it from `src/shared/interfaces/`.
4. Inject necessary dependencies (MikroORM `EntityManager`, Redis `Redis`, BullMQ `Queue`) in the constructor.

### Step 4: Create the Controller (`<feature>.controller.ts`)

1. Injects `find-<feature>.service.ts` and each single-action service.
2. Contains methods corresponding to each route endpoint.
3. **ZERO business logic**: Extract request input, call `service.handle(dto)` or `findService.findAll()`, and send reply.
4. Export the controller class and a default instance.

### Step 5: Create the Routes Plugin (`<feature>.routes.ts`)

1. Export a `FastifyPluginAsync` function.
2. Register endpoints with full TypeBox schemas.
3. Forward requests to the controller singleton.

### Step 6: Register in Router (`src/routes/router.ts`)

1. Import `<Feature>Routes` in `src/routes/router.ts`.
2. Register the plugin with prefix: `fastify.register(<Feature>Routes, { prefix: "<feature>" });`.

---

## Reference Templates

Read [templates.md](./references/templates.md) for complete code templates for schemas, routes, controllers, and services.

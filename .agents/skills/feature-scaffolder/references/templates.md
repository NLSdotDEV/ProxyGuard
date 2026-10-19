# Feature Scaffolding Templates

Use these templates when creating a new feature module in `src/features/<feature>/`. Replace `item` and `Item` with your domain entity name.

---

## 1. Schema Template (`item.schema.ts`)

```typescript
import Type, { Static } from 'typebox';

const CreateItemSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
});

const ItemIdParamSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
});

const ItemResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  createdAt: Type.String(),
});

export const ItemSchema = {
  create: CreateItemSchema,
  idParam: ItemIdParamSchema,
  response: ItemResponseSchema,
  listResponse: Type.Array(ItemResponseSchema),
};

export type CreateItemSchemaType = Static<typeof CreateItemSchema>;
export type ItemIdParamSchemaType = Static<typeof ItemIdParamSchema>;
export type ItemResponseSchemaType = Static<typeof ItemResponseSchema>;
```

---

## 2. Query Service Template (`services/find-item.service.ts`)

```typescript
import { EntityManager } from '@mikro-orm/sqlite';
import { ItemEntity } from '../../../database/entities/item.entity.js';

export class FindItemService {
  constructor(private readonly em: EntityManager) {}

  async findAll(filter: Record<string, any> = {}): Promise<ItemEntity[]> {
    return this.em.find(ItemEntity, filter);
  }

  async findOne(id: string): Promise<ItemEntity | null> {
    return this.em.findOne(ItemEntity, { id });
  }
}

// In real app, em is passed via bootstrap or DI container
export default new FindItemService({} as EntityManager);
```

---

## 3. Single-Action Service Template (`services/create-item.service.ts`)

```typescript
import { EntityManager } from '@mikro-orm/sqlite';
import { ItemEntity } from '../../../database/entities/item.entity.js';

// DTO exported directly from the service if single-use
export interface CreateItemDto {
  name: string;
  description?: string;
}

export interface CreateItemResult {
  id: string;
  name: string;
  createdAt: string;
}

export class CreateItemService {
  constructor(private readonly em: EntityManager) {}

  // Single-action class: ONLY handle method!
  async handle(dto: CreateItemDto): Promise<CreateItemResult> {
    const item = new ItemEntity();
    item.name = dto.name;
    item.description = dto.description;

    await this.em.persistAndFlush(item);

    return {
      id: item.id,
      name: item.name,
      createdAt: item.createdAt.toISOString(),
    };
  }
}

export default new CreateItemService({} as EntityManager);
```

---

## 4. Controller Template (`item.controller.ts`)

```typescript
import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller } from '#aegis/controller/controller.js';
import findItemService, {
  FindItemService,
} from './services/find-item.service.js';
import createItemService, {
  CreateItemService,
} from './services/create-item.service.js';
import { CreateItemSchemaType, ItemIdParamSchemaType } from './item.schema.js';

export class ItemController extends Controller {
  constructor(
    private readonly findItemService: FindItemService,
    private readonly createItemService: CreateItemService,
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as CreateItemSchemaType;
    const result = await this.createItemService.handle(body);
    reply.status(201).send(result);
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const items = await this.findItemService.findAll();
    reply.status(200).send(items);
  }

  async getOne(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as ItemIdParamSchemaType;
    const item = await this.findItemService.findOne(params.id);
    if (!item) {
      reply
        .status(404)
        .send({ error: 'ITEM_NOT_FOUND', message: 'Item not found' });
      return;
    }
    reply.status(200).send(item);
  }
}

export default new ItemController(findItemService, createItemService);
```

---

## 5. Routes Template (`item.routes.ts`)

```typescript
import { FastifyPluginAsync } from 'fastify';
import itemController from './item.controller.js';
import { ItemSchema } from './item.schema.js';

export const ItemRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/',
    {
      schema: {
        body: ItemSchema.create,
        response: { 201: ItemSchema.response },
      },
    },
    async (request, reply) => await itemController.create(request, reply),
  );

  fastify.get(
    '/',
    {
      schema: {
        response: { 200: ItemSchema.listResponse },
      },
    },
    async (request, reply) => await itemController.getAll(request, reply),
  );

  fastify.get(
    '/:id',
    {
      schema: {
        params: ItemSchema.idParam,
        response: { 200: ItemSchema.response },
      },
    },
    async (request, reply) => await itemController.getOne(request, reply),
  );
};
```

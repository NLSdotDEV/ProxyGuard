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
import { em } from '../../../database/db.js';
import { ItemEntity } from '../../../database/entities/item.entity.js';

export class FindItemService {
  async findAll(filter: Record<string, any> = {}): Promise<ItemEntity[]> {
    return em.find(ItemEntity, filter);
  }

  async findOne(id: string): Promise<ItemEntity | null> {
    return em.findOne(ItemEntity, { id });
  }
}

export default new FindItemService();
```

---

## 3. Single-Action Service Template (`services/create-item.service.ts`)

```typescript
import { em } from '../../../database/db.js';
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
  // Single-action class: ONLY handle method! Thin and simple!
  async handle(dto: CreateItemDto): Promise<CreateItemResult> {
    const item = em.create(ItemEntity, {
      name: dto.name,
      description: dto.description,
    });

    await em.flush();

    return {
      id: item.id,
      name: item.name,
      createdAt: item.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}

export default new CreateItemService();
```

---

## 4. Controller Template (`item.controller.ts`)

```typescript
import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller } from '#aegis/http';
import { HttpStatusCode } from 'axios';
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
  ) {
    super();
  }

  // CRUD patterns: findAll, findOne, create, update, delete
  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as CreateItemSchemaType;
    const result = await this.createItemService.handle(body);
    reply.status(HttpStatusCode.Created).send(result);
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const items = await this.findItemService.findAll();
    reply.status(HttpStatusCode.Ok).send(items);
  }

  async findOne(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as ItemIdParamSchemaType;
    const item = await this.findItemService.findOne(params.id);
    if (!item) {
      reply
        .status(HttpStatusCode.NotFound)
        .send({ error: 'ITEM_NOT_FOUND', message: 'Item not found' });
      return;
    }
    reply.status(HttpStatusCode.Ok).send(item);
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

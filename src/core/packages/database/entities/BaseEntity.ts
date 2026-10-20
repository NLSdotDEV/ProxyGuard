import { PrimaryKey, Property, Index } from '@mikro-orm/decorators/es';
import { randomUUIDv7 } from 'crypto';

@Index({ properties: ['id', 'createdAt', 'updatedAt'] })
export abstract class BaseEntity {
  @PrimaryKey({ type: 'uuid', onCreate: () => randomUUIDv7() })
  id: string = randomUUIDv7();

  @Property({ name: 'created_at', onCreate: () => new Date() })
  createdAt = new Date();

  @Property({
    name: 'created_at',
    onUpdate: () => new Date(),
    onCreate: () => new Date(),
  })
  updatedAt = new Date();
}

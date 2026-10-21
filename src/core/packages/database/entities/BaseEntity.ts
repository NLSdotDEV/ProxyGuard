import { PrimaryKey, Property, Index } from '@mikro-orm/decorators/es';
import { randomUUIDv7 } from 'crypto';

@Index({ properties: ['id', 'createdAt', 'updatedAt'] })
export abstract class BaseEntity {
  @PrimaryKey({ type: 'uuid', onCreate: () => randomUUIDv7() })
  id: string = randomUUIDv7();

  @Property({ name: 'created_at', onCreate: () => new Date(), nullable: false })
  createdAt?: Date = new Date();

  @Property({
    name: 'updated_at',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
    nullable: false,
  })
  updatedAt?: Date = new Date();
}

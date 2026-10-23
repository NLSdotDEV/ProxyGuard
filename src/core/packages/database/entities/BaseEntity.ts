import { PrimaryKey, Property, Index } from '@mikro-orm/decorators/es';
import * as crypto from 'crypto';

const generateUuid = (): string => {
  const c = crypto as unknown as {
    randomUUIDv7?: () => string;
    randomUUID: () => string;
  };
  if (typeof c.randomUUIDv7 === 'function') {
    return c.randomUUIDv7();
  }
  return c.randomUUID();
};

@Index({ properties: ['id', 'createdAt', 'updatedAt'] })
export abstract class BaseEntity {
  @PrimaryKey({ type: 'uuid', onCreate: () => generateUuid() })
  id: string = generateUuid();

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

import { BaseEntity } from '#aegis/database';
import { Cascade, Collection, Ref } from '@mikro-orm/core';
import {
  Property,
  Entity,
  ManyToOne,
  Unique,
  OneToMany,
} from '@mikro-orm/decorators/es';
import { ProxyAccount } from './ProxyAccount.js';
import { ProxyBan } from './ProxyBan.js';

@Entity({ tableName: 'proxy_endpoints' })
@Unique({ properties: ['address', 'proxy'] })
export class ProxyEndpoint extends BaseEntity {
  @Property()
  address!: string;

  @ManyToOne(() => ProxyAccount)
  proxy!: Ref<ProxyAccount>;

  @OneToMany(() => ProxyBan, (ban) => ban.endpoint, {
    cascade: [Cascade.REMOVE],
  })
  bans = new Collection<ProxyBan>(this);
}

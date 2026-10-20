import { BaseEntity } from '#aegis/database';
import { Cascade, Collection, Ref } from '@mikro-orm/core';
import {
  Entity,
  Property,
  ManyToOne,
  Unique,
  OneToMany,
} from '@mikro-orm/decorators/es';
import { ApiKey } from './ApiKey.js';
import { ProxyEndpoint } from './ProxyEndpoint.js';

@Entity({ tableName: 'proxy_accounts' })
@Unique({ properties: ['username', 'password'] })
export class ProxyAccount extends BaseEntity {
  @Property({hidden: true})
  username!: string;

  @Property({hidden: true})
  password!: string;

  @ManyToOne(() => ApiKey, {hidden: true})
  apiKey!: Ref<ApiKey>;

  @OneToMany(() => ProxyEndpoint, (endpoint) => endpoint.proxy, {
    cascade: [Cascade.REMOVE],
  })
  endpoints = new Collection<ProxyEndpoint>(this);
}

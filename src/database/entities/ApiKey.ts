import { Entity, OneToMany, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '#aegis/database';
import { Collection } from '@mikro-orm/core';
import { ProxyAccount } from './ProxyAccount.js';

@Entity({ tableName: 'api_keys' })
export class ApiKey extends BaseEntity {
  @Property({ type: 'string', hidden: true })
  secret!: string;

  @OneToMany(() => ProxyAccount, (proxyAccount) => proxyAccount.apiKey)
  proxyAccounts = new Collection<ProxyAccount>(this);
}

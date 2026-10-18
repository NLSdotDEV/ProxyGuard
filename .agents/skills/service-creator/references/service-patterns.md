# Service Patterns Reference Guide

## 1. Single-Action Service with Redis & Database (e.g. Proxy Leasing)

```typescript
import { EntityManager } from '@mikro-orm/sqlite';
import { Redis } from 'ioredis';
import { ProxyEntity } from '../../../database/entities/proxy.entity.js';
import { ProxyBanEntity } from '../../../database/entities/proxy-ban.entity.js';

// Export single-use DTO directly from this service file
export interface LeaseProxyDto {
  applicationId: string;
  targetUrl: string;
  cacheTime?: number;
}

export interface LeasedProxyResult {
  proxyId: string;
  proxyUrl: string;
  host: string;
  port: number;
  auth: { username: string; password: string };
  sticky: boolean;
  expiresAt: string;
}

export class LeaseProxyService {
  constructor(
    private readonly em: EntityManager,
    private readonly redis: Redis,
  ) {}

  // Single action class: ONLY handle method!
  async handle(dto: LeaseProxyDto): Promise<LeasedProxyResult> {
    const domain = new URL(dto.targetUrl).hostname;
    const cacheKey = `proxyguard:sticky:${dto.applicationId}:${domain}`;
    const ttl = dto.cacheTime ?? 60;

    // 1. Check Redis sticky session
    const cachedProxyId = await this.redis.get(cacheKey);
    if (cachedProxyId) {
      const cachedProxy = await this.em.findOne(ProxyEntity, {
        id: cachedProxyId,
      });
      if (cachedProxy) {
        return this.formatResult(cachedProxy, true, ttl);
      }
    }

    // 2. Query SQLite for a proxy NOT banned for this target domain
    const bannedProxyIds = (
      await this.em.find(
        ProxyBanEntity,
        { targetDomain: domain },
        { fields: ['proxy'] },
      )
    ).map((b) => b.proxy.id);

    const availableProxy = await this.em.findOne(ProxyEntity, {
      proxyAccount: { application: dto.applicationId, status: 'active' },
      id: { $nin: bannedProxyIds },
    });

    if (!availableProxy) {
      throw new Error('POOL_EXHAUSTED: No available proxy for target URL');
    }

    // 3. Cache sticky session in Redis
    await this.redis.set(cacheKey, availableProxy.id, 'EX', ttl);

    return this.formatResult(availableProxy, false, ttl);
  }

  // Private helper method (never public!)
  private formatResult(
    proxy: ProxyEntity,
    sticky: boolean,
    ttl: number,
  ): LeasedProxyResult {
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    return {
      proxyId: proxy.id,
      proxyUrl: `http://${proxy.proxyAccount.username}:${proxy.proxyAccount.password}@${proxy.ip}:${proxy.port}`,
      host: proxy.ip,
      port: proxy.port,
      auth: {
        username: proxy.proxyAccount.username,
        password: proxy.proxyAccount.password,
      },
      sticky,
      expiresAt,
    };
  }
}
```

---

## 2. Single-Action Service with BullMQ Job Queue (e.g. Account Creation)

```typescript
import { EntityManager } from '@mikro-orm/sqlite';
import { Queue } from 'bullmq';
import { ProxyAccountEntity } from '../../../database/entities/proxy-account.entity.js';

export interface CreateProxyAccountDto {
  applicationId: string;
  apiKey: string;
}

export interface CreateProxyAccountResult {
  accountId: string;
  status: 'inactive';
  message: string;
}

export class CreateProxyAccountService {
  constructor(
    private readonly em: EntityManager,
    private readonly hydrationQueue: Queue,
  ) {}

  // Single action class: ONLY handle method!
  async handle(dto: CreateProxyAccountDto): Promise<CreateProxyAccountResult> {
    const account = new ProxyAccountEntity();
    account.application = dto.applicationId as any;
    account.apiKey = dto.apiKey;
    account.status = 'inactive'; // Always inactive upon creation

    await this.em.persistAndFlush(account);

    // Dispatch background hydration job to BullMQ
    await this.hydrationQueue.add('hydrate-account', {
      accountId: account.id,
      apiKey: dto.apiKey,
    });

    return {
      accountId: account.id,
      status: 'inactive',
      message: 'Account created. Proxy hydration queued.',
    };
  }
}
```

---

## 3. Query Service (`find-*.service.ts`)

```typescript
import { EntityManager } from '@mikro-orm/sqlite';
import { ProxyAccountEntity } from '../../../database/entities/proxy-account.entity.js';

export class FindProxyAccountService {
  constructor(private readonly em: EntityManager) {}

  // ONLY findAll and findOne are permitted!
  async findAll(applicationId: string): Promise<ProxyAccountEntity[]> {
    return this.em.find(ProxyAccountEntity, { application: applicationId });
  }

  async findOne(id: string): Promise<ProxyAccountEntity | null> {
    return this.em.findOne(ProxyAccountEntity, { id });
  }
}
```

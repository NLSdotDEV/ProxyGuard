import { em } from '../../../database/db.js';
import {
  ProxyAccount,
  ProxyBan,
  ProxyEndpoint,
} from '../../../database/entities/index.js';
import {
  BadRequestException,
  NotFoundException,
} from '../../../exceptions/index.js';
import { AegisCache } from '../../../cache/redis.js';

export interface LeaseProxyDto {
  readonly apiKeyId: string;
  readonly url?: string;
}

export interface ProxyItem {
  readonly id: string;
  readonly address: string;
  readonly username: string;
  readonly password: string;
  readonly proxy: string;
}

export class LeaseProxyService {
  async handle(dto: LeaseProxyDto): Promise<ProxyItem> {
    let hostTarget: string | undefined;

    if (dto.url) {
      try {
        const parsedUrl = new URL(dto.url);
        hostTarget = parsedUrl.hostname;
      } catch {
        try {
          const parsedUrl = new URL(`http://${dto.url}`);
          hostTarget = parsedUrl.hostname;
        } catch {
          throw new BadRequestException('Invalid URL provided');
        }
      }
    }

    const cacheKey = hostTarget
      ? `proxy:sticky:${dto.apiKeyId}:${hostTarget}`
      : undefined;

    if (cacheKey && hostTarget) {
      const cachedEndpointId = await AegisCache.get(cacheKey);

      if (cachedEndpointId) {
        const isBanned = await em.findOne(ProxyBan, {
          hostTarget,
          endpoint: cachedEndpointId,
        });

        if (!isBanned) {
          const cachedEndpoint = await em.findOne(
            ProxyEndpoint,
            {
              id: cachedEndpointId,
              proxy: {
                apiKey: dto.apiKeyId,
                expiresAt: { $gt: new Date() },
              },
            },
            { populate: ['proxy'] },
          );

          if (cachedEndpoint) {
            const account = cachedEndpoint.proxy.getEntity();
            return this.formatProxy(cachedEndpoint, account);
          }
        }
      }
    }

    const accounts = await em.find(
      ProxyAccount,
      {
        apiKey: dto.apiKeyId,
        expiresAt: { $gt: new Date() },
      },
      {
        populate: ['endpoints'],
      },
    );

    if (accounts.length === 0) {
      throw new NotFoundException('No active proxy accounts found for API key');
    }

    let bannedEndpointIds = new Set<string>();
    if (hostTarget) {
      const bans = await em.find(ProxyBan, { hostTarget });
      bannedEndpointIds = new Set(bans.map((b) => b.endpoint.id));
    }

    const available: { endpoint: ProxyEndpoint; account: ProxyAccount }[] = [];
    for (const account of accounts) {
      for (const endpoint of account.endpoints) {
        if (!bannedEndpointIds.has(endpoint.id)) {
          available.push({ endpoint, account });
        }
      }
    }

    if (available.length === 0) {
      throw new NotFoundException('No available proxy found for target URL');
    }

    const selected = available[Math.floor(Math.random() * available.length)];

    if (cacheKey) {
      await AegisCache.set(cacheKey, selected.endpoint.id, 'EX', 60);
    }

    return this.formatProxy(selected.endpoint, selected.account);
  }

  private formatProxy(
    endpoint: ProxyEndpoint,
    account: ProxyAccount,
  ): ProxyItem {
    return {
      id: endpoint.id,
      address: endpoint.address,
      username: account.username,
      password: account.password,
      proxy: `http://${account.username}:${account.password}@${endpoint.address}`,
    };
  }
}

export const leaseProxyService = new LeaseProxyService();
export default leaseProxyService;

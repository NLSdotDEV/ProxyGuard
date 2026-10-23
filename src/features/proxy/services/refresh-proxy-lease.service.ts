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
import { ProxyItem } from './lease-proxy.service.js';

export interface RefreshProxyLeaseDto {
  readonly apiKeyId: string;
  readonly url: string;
  readonly endpointId: string;
}

export class RefreshProxyLeaseService {
  async handle(dto: RefreshProxyLeaseDto): Promise<ProxyItem> {
    let hostTarget: string;

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

    // Force clean up of the sticky IP in Redis
    const cacheKey = `proxy:sticky:${dto.apiKeyId}:${hostTarget}`;
    await AegisCache.del(cacheKey);

    // Look up and ban the specified endpoint
    const endpointToBan = await em.findOne(ProxyEndpoint, {
      id: dto.endpointId,
      proxy: { apiKey: dto.apiKeyId },
    });

    if (!endpointToBan) {
      throw new NotFoundException(
        `Endpoint not found for id ${dto.endpointId}`,
      );
    }

    const existingBan = await em.findOne(ProxyBan, {
      hostTarget,
      endpoint: endpointToBan,
    });

    if (!existingBan) {
      em.create(ProxyBan, {
        hostTarget,
        endpoint: endpointToBan,
      });
      await em.flush();
    }

    // Load active accounts
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

    // Filter out banned endpoints for this target
    const bans = await em.find(ProxyBan, { hostTarget });
    const bannedEndpointIds = new Set(bans.map((b) => b.endpoint.id));

    const available: { endpoint: ProxyEndpoint; account: ProxyAccount }[] = [];
    for (const account of accounts) {
      for (const endpoint of account.endpoints) {
        if (!bannedEndpointIds.has(endpoint.id)) {
          available.push({ endpoint, account });
        }
      }
    }

    if (available.length === 0) {
      throw new NotFoundException(
        'No available non-banned proxy found for target URL',
      );
    }

    // Assign a new non-banned proxy and set as the new sticky session
    const selected = available[Math.floor(Math.random() * available.length)];
    await AegisCache.set(cacheKey, selected.endpoint.id, 'EX', 60);

    return {
      id: selected.endpoint.id,
      address: selected.endpoint.address,
      username: selected.account.username,
      password: selected.account.password,
      proxy: `http://${selected.account.username}:${selected.account.password}@${selected.endpoint.address}`,
    };
  }
}

export default new RefreshProxyLeaseService();

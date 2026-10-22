import { Worker } from '#aegis/queues/queue.worker.js';
import { Job } from 'bullmq';
import { queue } from '../constants.js';
import { SyncProxyEndpointsJobData } from '../interfaces/sync-proxy-endpoints.interface.js';
import axios from 'axios';
import { em } from '../../database/db.js';
import { ProxyAccount, ProxyEndpoint } from '../../database/entities/index.js';

interface ProxyScrapeProxyListResponse {
  data?: Array<[string, string, string, string] | string[]>;
  recordsTotal?: number;
  recordsFiltered?: number;
  draw?: number;
}

export class SyncProxyEndpointsWorker extends Worker<
  SyncProxyEndpointsJobData,
  void
> {
  protected override queueName = queue.syncProxyEndpoints;
  protected override concurrency = 5;

  async execute(job: Job<SyncProxyEndpointsJobData, void>): Promise<void> {
    await this.syncProxyEndpoints(job.data);
  }

  private async syncProxyEndpoints(
    data: SyncProxyEndpointsJobData,
  ): Promise<void> {
    const { subAccountId, secret, proxyAccountId } = data;

    const baseUrl =
      process.env.PROXY_SCRAPE_BASE_API_URL ?? 'https://api.proxyscrape.com/v4';

    const requestUrl = `${baseUrl}/account/${subAccountId}/datacenter_shared/proxy-list`;
    const headers = {
      'api-token': secret,
    };
    const params = {
      protocol: 'http',
      type: 'getproxies',
      format: 'json',
    };

    const response = await axios.get<ProxyScrapeProxyListResponse>(requestUrl, {
      headers,
      params,
    });

    const proxyRows = response.data?.data;
    if (!Array.isArray(proxyRows) || proxyRows.length === 0) {
      return;
    }

    const fork = em.fork();
    const proxyAccount = await fork.findOne(ProxyAccount, {
      id: proxyAccountId,
    });

    if (!proxyAccount) {
      throw new Error(`ProxyAccount not found for id ${proxyAccountId}`);
    }

    const existingEndpoints = await fork.find(ProxyEndpoint, {
      proxy: proxyAccount,
    });
    const existingAddresses = new Set(
      existingEndpoints.map((endpoint) => endpoint.address),
    );

    for (const row of proxyRows) {
      const address = row[0];
      if (!address || typeof address !== 'string') {
        continue;
      }

      if (!existingAddresses.has(address)) {
        fork.create(ProxyEndpoint, {
          address,
          proxy: proxyAccount,
        });
        existingAddresses.add(address);
      }
    }

    await fork.flush();
  }

  failed(
    job: Job<SyncProxyEndpointsJobData, void> | undefined,
    error: Error,
    _prev?: string,
  ): void {
    console.error(
      `Job failed in queue ${this.queueName} (jobId: ${job?.id}):`,
      error,
    );
  }

  success(
    job: Job<SyncProxyEndpointsJobData, void>,
    _result: void,
    _prev?: string,
  ): void {
    console.log(
      `Job completed successfully in queue ${this.queueName} (jobId: ${job.id})`,
    );
  }
}

export const syncProxyEndpointsWorker = new SyncProxyEndpointsWorker();
export default syncProxyEndpointsWorker;

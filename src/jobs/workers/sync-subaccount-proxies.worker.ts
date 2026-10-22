import { Worker } from '#aegis/queues/queue.worker.js';
import { Job } from 'bullmq';
import { queue } from '../constants.js';
import { SyncSubaccountProxiesJobData } from '../interfaces/sync-subaccount-proxies.interface.js';
import axios from 'axios';
import { em } from '../../database/db.js';
import { ApiKey, ProxyAccount } from '../../database/entities/index.js';
import syncProxyEndpointsProducer from '../producers/sync-proxy-endpoints.producer.js';

interface ProxyScrapeOverviewResponse {
  status: string;
  data?: {
    services?: {
      datacenter_shared?: {
        proxy_username?: string;
        proxy_password?: string;
        expiration_time?: number;
      };
    };
  };
}

export class SyncSubaccountProxiesWorker extends Worker<
  SyncSubaccountProxiesJobData,
  void
> {
  protected override queueName = queue.syncSubaccountProxies;
  protected override concurrency = 5;

  async execute(job: Job<SyncSubaccountProxiesJobData, void>): Promise<void> {
    await this.syncSubaccount(job.data);
  }

  private async syncSubaccount(
    data: SyncSubaccountProxiesJobData,
  ): Promise<void> {
    const { subAccountId, secret, apiKeyId } = data;

    const baseUrl =
      process.env.PROXY_SCRAPE_BASE_API_URL ?? 'https://api.proxyscrape.com/v4';

    const requestUrl = `${baseUrl}/account/${subAccountId}/datacenter_shared/overview`;
    const headers = {
      'api-token': secret,
    };

    const response = await axios.get<ProxyScrapeOverviewResponse>(requestUrl, {
      headers,
    });

    if (response.data?.status === 'valid') {
      const datacenter = response.data?.data?.services?.datacenter_shared;
      if (datacenter?.proxy_username && datacenter?.proxy_password) {
        if (!datacenter.expiration_time) {
          return;
        }

        const expiresAt = new Date(datacenter.expiration_time * 1000);
        if (expiresAt.getTime() <= Date.now()) {
          return;
        }

        const fork = em.fork();
        const apiKey = await fork.findOne(ApiKey, { id: apiKeyId });
        if (!apiKey) {
          throw new Error(`ApiKey not found for id ${apiKeyId}`);
        }

        let proxyAccount = await fork.findOne(ProxyAccount, {
          username: datacenter.proxy_username,
          password: datacenter.proxy_password,
        });

        if (!proxyAccount) {
          proxyAccount = fork.create(ProxyAccount, {
            username: datacenter.proxy_username,
            password: datacenter.proxy_password,
            apiKey,
            expiresAt,
          });
        } else {
          proxyAccount.expiresAt = expiresAt;
        }

        await fork.flush();

        await syncProxyEndpointsProducer.dispatch({
          subAccountId,
          secret,
          proxyAccountId: proxyAccount.id,
        });
      }
    }
  }

  failed(
    job: Job<SyncSubaccountProxiesJobData, void> | undefined,
    error: Error,
    _prev?: string,
  ): void {
    console.error(
      `Job failed in queue ${this.queueName} (jobId: ${job?.id}):`,
      error,
    );
  }

  success(
    job: Job<SyncSubaccountProxiesJobData, void>,
    _result: void,
    _prev?: string,
  ): void {
    console.log(
      `Job completed successfully in queue ${this.queueName} (jobId: ${job.id})`,
    );
  }
}

export default new SyncSubaccountProxiesWorker();

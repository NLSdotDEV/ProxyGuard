import { Worker } from '#aegis/queues/queue.worker.js';
import { Job } from 'bullmq';
import { queue } from '../constants.js';
import { CheckProxyAccountJobData } from '../interfaces/check-proxy-account.interface.js';
import axios from 'axios';
import { em } from '../../database/db.js';
import { ProxyAccount } from '../../database/entities/index.js';

export class CheckProxyAccountWorker extends Worker<
  CheckProxyAccountJobData,
  void
> {
  protected override queueName = queue.checkProxyAccount;
  protected override concurrency = 5;

  async execute(job: Job<CheckProxyAccountJobData, void>): Promise<void> {
    await this.checkAccount(job.data);
  }

  private async checkAccount(data: CheckProxyAccountJobData): Promise<void> {
    const { endpointId, proxyAccountId, apiKeyId } = data;
    const fork = em.fork();

    const proxyAccount = await fork.findOne(
      ProxyAccount,
      {
        id: proxyAccountId,
        apiKey: apiKeyId,
      },
      { populate: ['endpoints'] },
    );

    if (!proxyAccount) {
      console.warn(
        `[CheckProxyAccount] ProxyAccount not found: ${proxyAccountId}`,
      );
      return;
    }

    // 1. Check expiration date
    if (proxyAccount.expiresAt.getTime() <= Date.now()) {
      console.warn(
        `[CheckProxyAccount] Account ${proxyAccountId} subscription expired at ${proxyAccount.expiresAt.toISOString()}`,
      );
      proxyAccount.expiresAt = new Date(0);
      await fork.flush();
      return;
    }

    // 2. Find endpoint address for live proxy check
    const endpoint =
      proxyAccount.endpoints.getItems().find((ep) => ep.id === endpointId) ??
      proxyAccount.endpoints[0];

    if (!endpoint) {
      console.warn(
        `[CheckProxyAccount] No endpoints associated with account: ${proxyAccountId}`,
      );
      return;
    }

    const [host, portStr] = endpoint.address.split(':');
    const port = parseInt(portStr, 10);

    // 3. Perform live proxy authentication & connectivity check
    try {
      const testUrl =
        process.env.PROXY_TEST_URL ?? 'http://api.proxyscrape.com/v4/health';

      await axios.get(testUrl, {
        proxy: {
          protocol: 'http',
          host,
          port,
          auth: {
            username: proxyAccount.username,
            password: proxyAccount.password,
          },
        },
        timeout: 10000,
        validateStatus: (status) => status < 500,
      });

      console.log(
        `[CheckProxyAccount] Account ${proxyAccountId} verified and active via ${endpoint.address}`,
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // 407 = Proxy Authentication Required -> credentials revoked/invalid
        if (error.response?.status === 407) {
          console.warn(
            `[CheckProxyAccount] Proxy authentication failed (407) for account ${proxyAccountId}. Deactivating account.`,
          );
          proxyAccount.expiresAt = new Date(0);
          await fork.flush();
          return;
        }
      }

      console.warn(
        `[CheckProxyAccount] Verification check warning for account ${proxyAccountId}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  failed(
    job: Job<CheckProxyAccountJobData, void> | undefined,
    error: Error,
    _prev?: string,
  ): void {
    console.error(
      `Job failed in queue ${this.queueName} (jobId: ${job?.id}):`,
      error,
    );
  }

  success(
    job: Job<CheckProxyAccountJobData, void>,
    _result: void,
    _prev?: string,
  ): void {
    console.log(
      `Job completed successfully in queue ${this.queueName} (jobId: ${job.id})`,
    );
  }
}

export const checkProxyAccountWorker = new CheckProxyAccountWorker();
export default checkProxyAccountWorker;

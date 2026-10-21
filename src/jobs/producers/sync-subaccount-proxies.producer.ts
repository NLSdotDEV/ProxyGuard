import { Producer } from '#aegis/queues/queue.producer.js';
import { JobsOptions, Job } from 'bullmq';
import { queue } from '../constants.js';
import { SyncSubaccountProxiesJobData } from '../interfaces/sync-subaccount-proxies.interface.js';

export class SyncSubaccountProxiesProducer extends Producer<SyncSubaccountProxiesJobData> {
  protected override queueName = queue.syncSubaccountProxies;

  async dispatch(
    data: SyncSubaccountProxiesJobData,
    opts?: JobsOptions,
  ): Promise<Job<SyncSubaccountProxiesJobData>> {
    return await this.queue.add(`${queue.syncSubaccountProxies}-task`, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      ...opts,
    });
  }
}

export default new SyncSubaccountProxiesProducer();

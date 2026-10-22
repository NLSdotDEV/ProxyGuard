import { Producer } from '#aegis/queues/queue.producer.js';
import { JobsOptions, Job } from 'bullmq';
import { queue } from '../constants.js';
import { SyncProxyEndpointsJobData } from '../interfaces/sync-proxy-endpoints.interface.js';

export class SyncProxyEndpointsProducer extends Producer<SyncProxyEndpointsJobData> {
  protected override queueName = queue.syncProxyEndpoints;

  async dispatch(
    data: SyncProxyEndpointsJobData,
    opts?: JobsOptions,
  ): Promise<Job<SyncProxyEndpointsJobData>> {
    return await this.queue.add(`${queue.syncProxyEndpoints}-task`, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      ...opts,
    });
  }
}

export default new SyncProxyEndpointsProducer();

import { Producer } from '#aegis/queues/queue.producer.js';
import { queue } from '../constants.js';
import { CheckProxyAccountJobData } from '../interfaces/check-proxy-account.interface.js';
import { Job, JobsOptions } from 'bullmq';

export class CheckProxyAccountProducer extends Producer<
  CheckProxyAccountJobData,
  void
> {
  protected override queueName = queue.checkProxyAccount;

  async dispatch(
    data: CheckProxyAccountJobData,
    opts?: JobsOptions,
  ): Promise<Job<CheckProxyAccountJobData, void>> {
    return await this.queue.add(this.queueName, data, opts);
  }
}

export const checkProxyAccountProducer = new CheckProxyAccountProducer();
export default checkProxyAccountProducer;

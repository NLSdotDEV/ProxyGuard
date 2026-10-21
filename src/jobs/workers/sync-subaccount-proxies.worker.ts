import { Worker } from '#aegis/queues/queue.worker.js';
import { Job } from 'bullmq';
import { queue } from '../constants.js';
import { SyncSubaccountProxiesJobData } from '../interfaces/sync-subaccount-proxies.interface.js';

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
    const { subAccountId } = data;
    console.log(`Processing subaccount ID: ${subAccountId}`);
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

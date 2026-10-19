import { Queue } from './queue.js';
import { Worker as BullMqWorker } from 'bullmq';

export abstract class Worker extends Queue {
  protected worker: BullMqWorker = new BullMqWorker(this.queue, this.execute);
  abstract execute(): Promise<void>;
}

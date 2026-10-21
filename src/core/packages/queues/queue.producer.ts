import { Queue } from 'bullmq';
import { AegisQueue } from './queue.js';

export abstract class AegisProducer<
  DataType = unknown,
  ResultType = unknown,
> extends AegisQueue {
  private _queue?: Queue<DataType, ResultType>;

  constructor(queueName?: string) {
    super(queueName);
  }

  public get queue(): Queue<DataType, ResultType> {
    if (!this._queue) {
      this._queue = new Queue<DataType, ResultType>(this.queueName, {
        connection: this.queueConnection,
      });
    }
    return this._queue;
  }

  abstract dispatch(...args: unknown[]): Promise<unknown>;

  async close(): Promise<void> {
    if (this._queue) {
      await this._queue.close();
    }
  }
}

export { AegisProducer as Producer };

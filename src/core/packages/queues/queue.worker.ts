import { Worker as BullMqWorker, Job } from 'bullmq';
import { AegisQueue } from './queue.js';

export abstract class AegisWorker<
  DataType = unknown,
  ResultType = unknown,
> extends AegisQueue {
  protected concurrency: number = 10;
  protected name?: string = undefined;

  protected _worker?: BullMqWorker<DataType, ResultType>;

  constructor(queueName?: string) {
    super(queueName);
    queueMicrotask(() => {
      this.start();
    });
  }

  public get worker(): BullMqWorker<DataType, ResultType> {
    return this.start();
  }

  public start(): BullMqWorker<DataType, ResultType> {
    if (!this._worker) {
      this._worker = new BullMqWorker<DataType, ResultType>(
        this.queueName,
        (job, token) => this.execute(job, token),
        {
          connection: this.queueConnection,
          concurrency: this.concurrency,
          name: this.name,
        },
      );

      this._worker.on('failed', (job, error, prev) => {
        void this.failed(job, error, prev);
      });

      this._worker.on('completed', (job, result, prev) => {
        void this.success(job, result, prev);
      });
    }

    return this._worker;
  }

  async close(force?: boolean): Promise<void> {
    if (this._worker) {
      await this._worker.close(force);
    }
  }

  abstract execute(
    job: Job<DataType, ResultType>,
    token?: string,
  ): Promise<ResultType>;
  abstract failed(
    job: Job<DataType, ResultType> | undefined,
    error: Error,
    prev?: string,
  ): Promise<void> | void;
  abstract success(
    job: Job<DataType, ResultType>,
    result: ResultType,
    prev?: string,
  ): Promise<void> | void;
}

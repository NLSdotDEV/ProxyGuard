import { ConnectionOptions } from 'bullmq';

export abstract class AegisQueue {
  protected queueConnection: ConnectionOptions = {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    ...(process.env.REDIS_PASSWORD
      ? { password: process.env.REDIS_PASSWORD }
      : {}),
  };

  protected queueName: string = 'default';

  constructor(queueName?: string) {
    if (queueName) {
      this.queueName = queueName;
    }
  }
}

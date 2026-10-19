import { Processor } from 'bullmq';

export abstract class Queue {
  protected queue: string = 'default';
}

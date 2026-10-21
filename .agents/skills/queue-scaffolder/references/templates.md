# Queue Scaffolder Boilerplate Templates

Copy and adapt these templates when scaffolding new background queues in ProxyGuard.

---

## 1. Job Payload Interface Template

File: `src/jobs/interfaces/<job-name>.interface.ts`

```typescript
export interface <JobName>JobData {
  id: string;
  // payload fields
}
```

---

## 2. Producer Template

File: `src/jobs/producers/<job-name>.producer.ts`

```typescript
import { Producer } from '#aegis/queues/queue.producer.js';
import { JobsOptions, Job } from 'bullmq';
import { queue } from '../constants.js';
import { <JobName>JobData } from '../interfaces/<job-name>.interface.js';

export class <JobName>Producer extends Producer<<JobName>JobData> {
  protected override queueName = queue.<jobName>;

  async dispatch(
    data: <JobName>JobData,
    opts?: JobsOptions,
  ): Promise<Job<<JobName>JobData>> {
    return await this.queue.add(`${queue.<jobName>}-task`, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      ...opts,
    });
  }
}

export const <jobName>Producer = new <JobName>Producer();
export default <jobName>Producer;
```

---

## 3. Worker Template

File: `src/jobs/workers/<job-name>.worker.ts`

```typescript
import { Worker } from '#aegis/queues/queue.worker.js';
import { Job } from 'bullmq';
import { queue } from '../constants.js';
import { <JobName>JobData } from '../interfaces/<job-name>.interface.js';

export class <JobName>Worker extends Worker<<JobName>JobData> {
  protected override queueName = queue.<jobName>;
  protected override concurrency = 5;

  async execute(job: Job<<JobName>JobData>): Promise<void> {
    const { id } = job.data;
    // Perform background business logic here
  }

  async failed(
    job: Job<<JobName>JobData> | undefined,
    error: Error,
  ): Promise<void> {
    // Handle failures, send alerts, or log error
  }

  async success(job: Job<<JobName>JobData>): Promise<void> {
    // Handle completion cleanup or success metrics
  }
}

export const <jobName>Worker = new <JobName>Worker();
export default <jobName>Worker;
```

---

## 4. Central Registry Template

File: `src/jobs/index.ts`

```typescript
import { <jobName>Worker } from './workers/<job-name>.worker.js';
import { <jobName>Producer } from './queues/<job-name>.producer.js';

export const workers = [
  <jobName>Worker,
];

export const producers = [
  <jobName>Producer,
];

export async function closeAllJobs(): Promise<void> {
  // 1. Drain and close active workers first
  await Promise.all(workers.map((worker) => worker.close()));

  // 2. Close producer Redis connections
  await Promise.all(producers.map((producer) => producer.close()));
}
```

---

## 5. Hooking into Bootstrap

File: `src/bootstrap/app.ts`

```typescript
import { FastifyInstance } from 'fastify';
import { closeAllJobs } from '../jobs/index.js';

export async function boostrap(server: FastifyInstance) {
  // Workers auto-start upon import
  // ... other initialization

  server.addHook('onClose', async () => {
    await closeAllJobs();
  });
}
```

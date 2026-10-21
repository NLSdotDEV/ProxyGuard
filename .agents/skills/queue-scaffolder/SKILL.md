---
name: queue-scaffolder
description: >-
  Scaffolds BullMQ background jobs, queue producers, and queue workers adhering to Aegis framework standards.
  Use this skill whenever creating, adding, refactoring, or wiring background queues, workers, or producers.
---

# Queue Scaffolder Skill

This skill guides the creation and wiring of BullMQ background jobs in ProxyGuard, utilizing the internal **Aegis** framework foundation classes (`#aegis/queues/*`).

---

## Directory Organization

All background job infrastructure resides under `src/jobs/`:

```text
src/jobs/
├── index.ts                              # Central registry & bulk graceful shutdown
├── constants.ts                          # Queue names dictionary (queue.<name>)
├── interfaces/
│   └── <job-name>.interface.ts           # Shared payload interface contract
├── producers/
│   └── <job-name>.producer.ts            # Producer class extending Aegis Producer
└── workers/
    └── <job-name>.worker.ts              # Worker class extending Aegis Worker
```

---

## The 4 Steps to Add a Background Job

### Step 1: Create the Job Payload Interface

File: `src/jobs/interfaces/<job-name>.interface.ts`
Define the strongly typed payload contract shared between the producer and the consumer:

```typescript
export interface AccountHydrationJobData {
  accountId: string;
  apiKey: string;
}
```

### Step 2: Create the Producer

File: `src/jobs/queues/<job-name>.producer.ts`

1. Extend `Producer<DataType, ResultType>` from `#aegis/queues/queue.producer.js`.
2. Specify `protected override queueName = '<job-name>'`.
3. Implement `dispatch(data: DataType, opts?: JobsOptions): Promise<Job<DataType, ResultType>>` using `this.queue.add(...)`.
4. Export the class and an instantiated singleton instance.

### Step 3: Create the Worker (Consumer)

File: `src/jobs/workers/<job-name>.worker.ts`

1. Extend `Worker<DataType, ResultType>` from `#aegis/queues/queue.worker.js`.
2. Specify matching `protected override queueName = '<job-name>'`.
3. Optionally set `protected override concurrency = <number>` (default: 5).
4. Implement:
   - `async execute(job: Job<DataType, ResultType>): Promise<ResultType>`
   - `async failed(job: Job<DataType, ResultType> | undefined, error: Error): Promise<void>`
   - `async success(job: Job<DataType, ResultType>, result: ResultType): Promise<void>`
5. Export the class and an instantiated singleton.

### Step 4: Register in the Central Registry

File: `src/jobs/index.ts`

1. Add the worker instance to `export const workers = [...]`.
2. Add the producer instance to `export const producers = [...]`.
3. Ensure `closeAllJobs()` closes workers first, then producers.
4. Verify `closeAllJobs()` is mounted in Fastify's `onClose` hook in `src/bootstrap/app.ts`.

---

## Templates & Reference Implementations

Read [templates.md](./references/templates.md) for production-ready boilerplate code.

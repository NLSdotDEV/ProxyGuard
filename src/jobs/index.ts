import syncSubaccountProxiesProducer from './producers/sync-subaccount-proxies.producer.js';
import syncSubaccountProxiesWorker from './workers/sync-subaccount-proxies.worker.js';

export * from './constants.js';

export const workers = [syncSubaccountProxiesWorker];

export const producers = [syncSubaccountProxiesProducer];

export async function closeAllJobs(): Promise<void> {
  await Promise.all(workers.map((worker) => worker.close()));
  await Promise.all(producers.map((producer) => producer.close()));
}

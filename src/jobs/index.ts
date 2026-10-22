import syncSubaccountProxiesProducer from './producers/sync-subaccount-proxies.producer.js';
import syncSubaccountProxiesWorker from './workers/sync-subaccount-proxies.worker.js';
import syncProxyEndpointsProducer from './producers/sync-proxy-endpoints.producer.js';
import syncProxyEndpointsWorker from './workers/sync-proxy-endpoints.worker.js';

export * from './constants.js';

export const workers = [syncSubaccountProxiesWorker, syncProxyEndpointsWorker];

export const producers = [
  syncSubaccountProxiesProducer,
  syncProxyEndpointsProducer,
];

export async function closeAllJobs(): Promise<void> {
  await Promise.all(workers.map((worker) => worker.close()));
  await Promise.all(producers.map((producer) => producer.close()));
}

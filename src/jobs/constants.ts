export const queue = {
  syncSubaccountProxies: 'sync-subaccount-proxies',
  syncProxyEndpoints: 'sync-proxy-endpoints',
} as const;

export const queues = queue;

export type QueueName = (typeof queue)[keyof typeof queue];

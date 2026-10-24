export const queue = {
  syncSubaccountProxies: 'sync-subaccount-proxies',
  syncProxyEndpoints: 'sync-proxy-endpoints',
  checkProxyAccount: 'check-proxy-account',
} as const;

export const queues = queue;

export type QueueName = (typeof queue)[keyof typeof queue];

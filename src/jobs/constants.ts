export const queue = {
  syncSubaccountProxies: 'sync-subaccount-proxies',
} as const;

export const queues = queue;

export type QueueName = (typeof queue)[keyof typeof queue];

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ApiKeyRoutes } from '../features/api-key/api-key.routes.js';
import { ProxyScrapeRoutes } from '../features/proxy-scrape/proxy-scrape.routes.js';
import { ProxyRoutes } from '../features/proxy/proxy.routes.js';

// define routes
const routes: FastifyPluginAsync = async (fastify, _opts) => {
  await fastify.register(ApiKeyRoutes, { prefix: 'api-keys' });
  await fastify.register(ProxyScrapeRoutes, { prefix: 'proxy-scrape' });
  await fastify.register(ProxyRoutes, { prefix: 'proxy' });
};

export class Router {
  static async define(instance: FastifyInstance) {
    const v1 = 'v1';
    const currentVersion = v1;
    instance.register(routes, { prefix: `api/${currentVersion}` });
  }
}

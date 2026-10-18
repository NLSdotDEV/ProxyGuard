import { FastifyInstance, FastifyPluginAsync } from 'fastify';

// define routes
const routes: FastifyPluginAsync = async (_fastify, _opts) => {
  // Feature route plugins will be registered here, e.g.:
  // fastify.register(ProxyRoutes, { prefix: 'proxies' });
};

export class Router {
  static async define(instance: FastifyInstance) {
    const v1 = 'v1';
    const currentVersion = v1;
    instance.register(routes, { prefix: `api/${currentVersion}` });
  }
}

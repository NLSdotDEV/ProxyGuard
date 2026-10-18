import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AppRoutes } from './app-feature/app.routes.js';

// Define routes plugin registering all feature plugins with their prefix
const routes: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.register(AppRoutes, { prefix: 'app' });
  // Add additional features here:
  // fastify.register(ProxyRoutes, { prefix: 'proxies' });
};

export class Router {
  static async define(instance: FastifyInstance) {
    const v1 = 'v1';
    const currentVersion = v1;
    instance.register(routes, { prefix: `api/${currentVersion}` });
  }
}

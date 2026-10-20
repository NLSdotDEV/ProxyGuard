import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ApiKeyRoutes } from '../features/api-key/api-key.routes.js';

// define routes
const routes: FastifyPluginAsync = async (fastify, _opts) => {
  await fastify.register(ApiKeyRoutes, { prefix: 'api-keys' });
};

export class Router {
  static async define(instance: FastifyInstance) {
    const v1 = 'v1';
    const currentVersion = v1;
    instance.register(routes, { prefix: `api/${currentVersion}` });
  }
}

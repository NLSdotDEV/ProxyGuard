import { FastifyPluginAsync } from 'fastify';
import { HasValidApiKeyGuard } from '../../shared/guards/has-valid-api-key.guard.js';
import proxyController from './proxy.controller.js';
import { ProxySchema } from './proxy.schema.js';

const rateLimitConfig = {
  rateLimit: {
    max: 10,
    timeWindow: '1 minute',
  },
};

export const ProxyRoutes: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.addHook('preHandler', HasValidApiKeyGuard);

  fastify.put(
    '/lease',
    {
      config: rateLimitConfig,
      schema: {
        body: ProxySchema.lease,
        response: {
          200: ProxySchema.response,
        },
      },
    },
    async (request, reply) => await proxyController.lease(request, reply),
  );

  fastify.put(
    '/lease/refresh',
    {
      config: rateLimitConfig,
      schema: {
        body: ProxySchema.refresh,
        response: {
          200: ProxySchema.response,
        },
      },
    },
    async (request, reply) => await proxyController.refresh(request, reply),
  );
};

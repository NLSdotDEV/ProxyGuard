import { FastifyPluginAsync } from 'fastify';
import { HasValidApiKeyGuard } from '../../shared/guards/has-valid-api-key.guard.js';
import proxyScrapeController from './proxy-scrape.controller.js';
import { ProxyScrapeSchema } from './proxy-scrape.schema.js';

export const ProxyScrapeRoutes: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.addHook('preHandler', HasValidApiKeyGuard);

  fastify.post(
    '/load-subaccounts',
    {
      schema: {
        body: ProxyScrapeSchema.loadSubAccounts,
      },
    },
    async (request, reply) =>
      await proxyScrapeController.loadSubAccounts(request, reply),
  );
};

import { FastifyPluginAsync } from 'fastify';
import appController from './app.controller.js';
import { AppSchema } from './app.schema.js';

export const AppRoutes: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.post(
    '/get-hello',
    {
      schema: {
        body: AppSchema.getHello,
      },
    },
    async (request, reply) => await appController.getHello(request, reply),
  );
};

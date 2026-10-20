import { FastifyPluginAsync } from 'fastify';
import apiKeyController from './api-key.controller.js';
import { ApiKeySchema } from './api-key.schema.js';

export const ApiKeyRoutes: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.post(
    '/',
    {
      preValidation: async (request) => {
        if (request.body === undefined || request.body === null) {
          request.body = {};
        }
      },
      schema: {
        response: {
          200: ApiKeySchema.response,
          201: ApiKeySchema.response,
        },
      },
      config: {
        rateLimit: {
          max: process.env.ENV === "production" ? 1 : 5,
          timeWindow: process.env.ENV === "production" ? "30 minute" : "1 minute"
        },
      },
    },
    async (request, reply) => await apiKeyController.create(request, reply),
  );
};

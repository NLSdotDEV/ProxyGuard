import {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import { Router } from '../routes/router.js';
import { em, initDatabase, orm } from '../database/db.js';
import { RequestContext } from '@mikro-orm/core';
import fastifyRateLimit from '@fastify/rate-limit';
import { Exception } from '#aegis/http';
import { NotFoundException } from '../exceptions/not-found.exception.js';
import { closeAllJobs } from '../jobs/index.js';

function errorHandler(instance: FastifyInstance) {
  instance.setErrorHandler((error: FastifyError | Error, request, reply) => {
    if (error instanceof Exception) {
      return reply.status(error.getStatusCode()).send(error.toObject());
    }

    if ('validation' in error && error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        errorCode: 'VALIDATION_ERROR',
        message: error.message,
        validation: error.validation,
      });
    }

    const statusCode = (error as FastifyError).statusCode ?? 500;
    const errorCode =
      (error as FastifyError).code ??
      (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR');

    request.log.error(error);

    return reply.status(statusCode).send({
      statusCode,
      errorCode,
      message: statusCode === 500 ? 'Internal Server Error' : error.message,
    });
  });

  instance.setNotFoundHandler(
    (request: FastifyRequest, reply: FastifyReply) => {
      const notFound = new NotFoundException(
        `Route ${request.method}:${request.url} not found`,
      );
      return reply.status(notFound.getStatusCode()).send(notFound.toObject());
    },
  );
}

export async function boostrap(server: FastifyInstance) {
  // error handler
  errorHandler(server);

  // database
  await initDatabase();

  server.addHook('onRequest', (_, __, done) => {
    RequestContext.create(em, done);
  });

  server.addHook('onClose', async () => {
    await orm.close();
    await closeAllJobs();
  });

  // rate limiting
  await server.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // health check
  server.get('/health', async (_request, reply) => {
    reply
      .status(200)
      .send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // route definition
  await Router.define(server);
}

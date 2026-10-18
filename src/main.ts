import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastify from 'fastify';
import { boostrap } from './bootstrap/app.js';

const server = fastify({
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

try {
  await boostrap(server);
  await server.listen({ port: parseInt(process.env.PORT ?? '3000') });
} catch (error) {
  if (error) {
    server.log.error(error);
  }
}

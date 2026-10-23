import 'dotenv/config';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastify from 'fastify';
import { boostrap } from './bootstrap/app.js';

const server = fastify({
  logger: true,
  trustProxy: true,
}).withTypeProvider<TypeBoxTypeProvider>();

try {
  await boostrap(server);
  await server.listen({
    port: parseInt(process.env.PORT ?? '3000'),
    host: process.env.HOST ?? '0.0.0.0',
  });
} catch (error) {
  if (error) {
    server.log.error(error);
  }
}

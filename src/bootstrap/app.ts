import { FastifyInstance } from 'fastify';
import { Router } from '../routes/router.js';
import { em, initDatabase, orm } from '../database/db.js';
import { RequestContext } from '@mikro-orm/core';


export async function boostrap(server: FastifyInstance) {
  // database
  await initDatabase();

  server.addHook("onRequest", (_, __, done) => {
    RequestContext.create(em, done);
  });

  server.addHook("onClose", () => {
    orm.close();
  })

  // route definition

  await Router.define(server);
}

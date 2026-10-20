import mikroOrmConfig from '../mikro-orm.config.js';
import { MikroORM, Options, EntityManager } from '@mikro-orm/core';

export let em: EntityManager;
export let orm: MikroORM;

export async function initDatabase() {
  orm = await MikroORM.init(mikroOrmConfig as Options);
  em = orm.em;
}

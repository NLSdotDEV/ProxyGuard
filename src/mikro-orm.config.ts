import { defineConfig } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { SeedManager } from '@mikro-orm/seeder';
import { Migrator } from '@mikro-orm/migrations';
import { ApiKey, ProxyAccount, ProxyBan, ProxyEndpoint } from './database/entities/index.js';

export default defineConfig({
  dbName: 'src/storage/db.sqlite',
  metadataProvider: TsMorphMetadataProvider,
  metadataCache: { pretty: true },
  driver: SqliteDriver,
  migrations: {
    pathTs: './src/database/migrations',
    path: './build/database/migrations',
    fileName(timestamp, name) {
      return `migration_${timestamp}_${name}`;
    },
  },
  seeder: {
    pathTs: './src/database/seeders',
    path: './build/database/seeders',
  },
  extensions: [SeedManager, Migrator],
  entities: [ApiKey, ProxyAccount, ProxyBan, ProxyEndpoint],
  debug: true,
});

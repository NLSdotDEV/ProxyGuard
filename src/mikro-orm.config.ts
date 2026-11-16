import { defineConfig } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SeedManager } from '@mikro-orm/seeder';
import { Migrator } from '@mikro-orm/migrations';
import { PostgreSqlDriver } from "@mikro-orm/postgresql"
import {
  ApiKey,
  ProxyAccount,
  ProxyBan,
  ProxyEndpoint,
} from './database/entities/index.js';
import dotenv from "dotenv";
dotenv.config()

const dbName = process.env.DB_NAME ?? 'proxyguard';
const host = process.env.DB_HOST ?? "localhost";
const port = parseInt(process.env.DB_PORT ?? "5432");
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD

export default defineConfig({
  dbName,
  host,
  port,
  user,
  password,
  metadataProvider: TsMorphMetadataProvider,
  metadataCache: { pretty: true },
  driver: PostgreSqlDriver,
  migrations: {
    pathTs: './src/database/migrations',
    path: './build/database/migrations',
    fileName(timestamp, name) {
      return `migration_${timestamp}` + (name ? `_${name}` : '');
    },
  },
  seeder: {
    pathTs: './src/database/seeders',
    path: './build/database/seeders',
  },
  extensions: [SeedManager, Migrator],
  entities: [ApiKey, ProxyAccount, ProxyBan, ProxyEndpoint],
  debug: (process.env.NODE_ENV ?? process.env.ENV) !== 'production',
});

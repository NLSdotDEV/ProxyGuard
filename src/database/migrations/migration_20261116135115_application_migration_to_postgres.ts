import { Migration } from '@mikro-orm/migrations';

export class Migration20261116135115_application_migration_to_postgres extends Migration {

  override name = 'Migration20261116135115_application_migration_to_postgres';

  override up(): void | Promise<void> {
    this.addSql(`create table "api_keys" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" varchar(255) null, "secret" varchar(255) not null, primary key ("id"));`);

    this.addSql(`create table "proxy_accounts" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "username" varchar(255) not null, "password" varchar(255) not null, "api_key_id" uuid not null, "expires_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "proxy_accounts" add constraint "proxy_accounts_username_password_unique" unique ("username", "password");`);

    this.addSql(`create table "proxy_endpoints" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "address" varchar(255) not null, "proxy_id" uuid not null, primary key ("id"));`);
    this.addSql(`alter table "proxy_endpoints" add constraint "proxy_endpoints_address_proxy_id_unique" unique ("address", "proxy_id");`);

    this.addSql(`create table "proxy_bans" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "host_target" varchar(255) not null, "endpoint_id" uuid not null, "banned_until" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "proxy_bans" add constraint "proxy_bans_host_target_endpoint_id_unique" unique ("host_target", "endpoint_id");`);

    this.addSql(`alter table "proxy_accounts" add constraint "proxy_accounts_api_key_id_foreign" foreign key ("api_key_id") references "api_keys" ("id");`);

    this.addSql(`alter table "proxy_endpoints" add constraint "proxy_endpoints_proxy_id_foreign" foreign key ("proxy_id") references "proxy_accounts" ("id");`);

    this.addSql(`alter table "proxy_bans" add constraint "proxy_bans_endpoint_id_foreign" foreign key ("endpoint_id") references "proxy_endpoints" ("id");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "proxy_accounts" drop constraint "proxy_accounts_api_key_id_foreign";`);
    this.addSql(`alter table "proxy_endpoints" drop constraint "proxy_endpoints_proxy_id_foreign";`);
    this.addSql(`alter table "proxy_bans" drop constraint "proxy_bans_endpoint_id_foreign";`);

    this.addSql(`drop table if exists "api_keys" cascade;`);
    this.addSql(`drop table if exists "proxy_accounts" cascade;`);
    this.addSql(`drop table if exists "proxy_endpoints" cascade;`);
    this.addSql(`drop table if exists "proxy_bans" cascade;`);
  }

}

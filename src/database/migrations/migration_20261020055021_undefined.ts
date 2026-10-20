import { Migration } from '@mikro-orm/migrations';

export class Migration20261020055021 extends Migration {

  override name = 'Migration20261020055021';

  override up(): void | Promise<void> {
    this.addSql(`create table \`api_keys\` (\`id\` text not null primary key, \`created_at\` datetime not null, \`updated_at\` datetime not null, \`secret\` text not null);`);

    this.addSql(`create table \`proxy_accounts\` (\`id\` text not null primary key, \`created_at\` datetime not null, \`updated_at\` datetime not null, \`username\` text not null, \`password\` text not null, \`api_key_id\` text not null, constraint \`proxy_accounts_api_key_id_foreign\` foreign key (\`api_key_id\`) references \`api_keys\` (\`id\`));`);
    this.addSql(`create index \`proxy_accounts_api_key_id_index\` on \`proxy_accounts\` (\`api_key_id\`);`);
    this.addSql(`create unique index \`proxy_accounts_username_password_unique\` on \`proxy_accounts\` (\`username\`, \`password\`);`);

    this.addSql(`create table \`proxy_endpoints\` (\`id\` text not null primary key, \`created_at\` datetime not null, \`updated_at\` datetime not null, \`address\` text not null, \`proxy_id\` text not null, constraint \`proxy_endpoints_proxy_id_foreign\` foreign key (\`proxy_id\`) references \`proxy_accounts\` (\`id\`));`);
    this.addSql(`create index \`proxy_endpoints_proxy_id_index\` on \`proxy_endpoints\` (\`proxy_id\`);`);
    this.addSql(`create unique index \`proxy_endpoints_address_proxy_id_unique\` on \`proxy_endpoints\` (\`address\`, \`proxy_id\`);`);

    this.addSql(`create table \`proxy_bans\` (\`id\` text not null primary key, \`created_at\` datetime not null, \`updated_at\` datetime not null, \`host_target\` text not null, \`endpoint_id\` text not null, constraint \`proxy_bans_endpoint_id_foreign\` foreign key (\`endpoint_id\`) references \`proxy_endpoints\` (\`id\`));`);
    this.addSql(`create index \`proxy_bans_endpoint_id_index\` on \`proxy_bans\` (\`endpoint_id\`);`);
    this.addSql(`create unique index \`proxy_bans_host_target_endpoint_id_unique\` on \`proxy_bans\` (\`host_target\`, \`endpoint_id\`);`);

    this.addSql(`drop table if exists \`tests\`;`);
  }

  override down(): void | Promise<void> {

    this.addSql(`create table \`tests\` (\`id\` integer not null primary key autoincrement, \`name\` TEXT not null);`);

    this.addSql(`drop table if exists \`api_keys\`;`);
    this.addSql(`drop table if exists \`proxy_accounts\`;`);
    this.addSql(`drop table if exists \`proxy_endpoints\`;`);
    this.addSql(`drop table if exists \`proxy_bans\`;`);
  }

}

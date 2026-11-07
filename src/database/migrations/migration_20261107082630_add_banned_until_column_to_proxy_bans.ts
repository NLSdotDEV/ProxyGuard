import { Migration } from '@mikro-orm/migrations';

export class Migration20261107082630_add_banned_until_column_to_proxy_bans extends Migration {

  override name = 'Migration20261107082630_add_banned_until_column_to_proxy_bans';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`proxy_bans\` add column \`banned_until\` datetime null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`proxy_bans\` drop column \`banned_until\`;`);
  }

}

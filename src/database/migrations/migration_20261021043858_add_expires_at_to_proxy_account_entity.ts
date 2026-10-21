import { Migration } from '@mikro-orm/migrations';

export class Migration20261021043858_add_expires_at_to_proxy_account_entity extends Migration {
  override name =
    'Migration20261021043858_add_expires_at_to_proxy_account_entity';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table \`proxy_accounts\` add column \`expires_at\` datetime not null;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`proxy_accounts\` drop column \`expires_at\`;`);
  }
}

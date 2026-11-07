import { Migration } from '@mikro-orm/migrations';

export class Migration20261031053735_add_name_to_api_keys_table extends Migration {

  override name = 'Migration20261031053735_add_name_to_api_keys_table';

  override up(): void | Promise<void> {
    this.addSql(`alter table \`api_keys\` add column \`name\` text null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`api_keys\` drop column \`name\`;`);
  }

}

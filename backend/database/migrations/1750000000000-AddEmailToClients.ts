import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEmailToClients1750000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('clients');
    const emailColumn = table?.findColumnByName('email');
    
    if (!emailColumn) {
      await queryRunner.addColumn(
        'clients',
        new TableColumn({
          name: 'email',
          type: 'varchar',
          length: '255',
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('clients');
    const emailColumn = table?.findColumnByName('email');
    
    if (emailColumn) {
      await queryRunner.dropColumn('clients', 'email');
    }
  }
}


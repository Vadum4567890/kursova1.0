import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCarSpecifications1730000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Helper function to check if column exists
    const columnExists = async (tableName: string, columnName: string): Promise<boolean> => {
      const result = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' AND column_name = '${columnName}'
      `);
      return result.length > 0;
    };

    // Add new optional columns to cars table (only if they don't exist)
    const columnsToAdd = [
      { name: 'bodyType', type: 'varchar', length: '255', isNullable: true },
      { name: 'driveType', type: 'varchar', length: '255', isNullable: true },
      { name: 'transmission', type: 'varchar', length: '255', isNullable: true },
      { name: 'engine', type: 'varchar', length: '255', isNullable: true },
      { name: 'fuelType', type: 'varchar', length: '255', isNullable: true },
      { name: 'seats', type: 'integer', isNullable: true },
      { name: 'mileage', type: 'integer', isNullable: true },
      { name: 'color', type: 'varchar', length: '255', isNullable: true },
      { name: 'features', type: 'text', isNullable: true },
      { name: 'imageUrls', type: 'text', isNullable: true },
    ];

    for (const col of columnsToAdd) {
      const exists = await columnExists('cars', col.name);
      if (!exists) {
        await queryRunner.addColumn(
          'cars',
          new TableColumn({
            name: col.name,
            type: col.type as any,
            length: col.length,
            isNullable: col.isNullable,
          })
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Helper function to check if column exists
    const columnExists = async (tableName: string, columnName: string): Promise<boolean> => {
      const result = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' AND column_name = '${columnName}'
      `);
      return result.length > 0;
    };

    // Remove columns in reverse order (only if they exist)
    const columnsToRemove = [
      'imageUrls',
      'features',
      'color',
      'mileage',
      'seats',
      'fuelType',
      'engine',
      'transmission',
      'driveType',
      'bodyType',
    ];

    for (const colName of columnsToRemove) {
      const exists = await columnExists('cars', colName);
      if (exists) {
        await queryRunner.dropColumn('cars', colName);
      }
    }
  }
}


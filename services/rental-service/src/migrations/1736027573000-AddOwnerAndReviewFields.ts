import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOwnerAndReviewFields1736027573000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add owner_user_id column
    await queryRunner.addColumn(
      'rentals',
      new TableColumn({
        name: 'owner_user_id',
        type: 'uuid',
        isNullable: true,
      })
    );

    // Add owner_approval_status column
    await queryRunner.addColumn(
      'rentals',
      new TableColumn({
        name: 'owner_approval_status',
        type: 'varchar',
        length: '50',
        default: "'pending'",
        isNullable: false,
      })
    );

    // Add review_status column
    await queryRunner.addColumn(
      'rentals',
      new TableColumn({
        name: 'review_status',
        type: 'varchar',
        length: '50',
        default: "'not_available'",
        isNullable: false,
      })
    );

    // Add review_window_closes_at column
    await queryRunner.addColumn(
      'rentals',
      new TableColumn({
        name: 'review_window_closes_at',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Add owner_review_submitted_at column
    await queryRunner.addColumn(
      'rentals',
      new TableColumn({
        name: 'owner_review_submitted_at',
        type: 'timestamp',
        isNullable: true,
      })
    );

    // Add renter_review_submitted_at column
    await queryRunner.addColumn(
      'rentals',
      new TableColumn({
        name: 'renter_review_submitted_at',
        type: 'timestamp',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('rentals', 'renter_review_submitted_at');
    await queryRunner.dropColumn('rentals', 'owner_review_submitted_at');
    await queryRunner.dropColumn('rentals', 'review_window_closes_at');
    await queryRunner.dropColumn('rentals', 'review_status');
    await queryRunner.dropColumn('rentals', 'owner_approval_status');
    await queryRunner.dropColumn('rentals', 'owner_user_id');
  }
}

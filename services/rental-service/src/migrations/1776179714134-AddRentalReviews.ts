import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRentalReviews1776179714134 implements MigrationInterface {
  name = 'AddRentalReviews1776179714134';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'rentals_review_status_enum'
        ) THEN
          CREATE TYPE "public"."rentals_review_status_enum" AS ENUM (
            'not_available',
            'waiting',
            'partial',
            'published',
            'expired'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "rentals"
      ADD COLUMN IF NOT EXISTS "owner_user_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "rentals"
      ADD COLUMN IF NOT EXISTS "review_status" "public"."rentals_review_status_enum" NOT NULL DEFAULT 'not_available'
    `);
    await queryRunner.query(`
      ALTER TABLE "rentals"
      ADD COLUMN IF NOT EXISTS "review_window_closes_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "rentals"
      ADD COLUMN IF NOT EXISTS "owner_review_submitted_at" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "rentals"
      ADD COLUMN IF NOT EXISTS "renter_review_submitted_at" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "rentals"
      DROP COLUMN IF EXISTS "renter_review_submitted_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "rentals"
      DROP COLUMN IF EXISTS "owner_review_submitted_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "rentals"
      DROP COLUMN IF EXISTS "review_window_closes_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "rentals"
      DROP COLUMN IF EXISTS "review_status"
    `);
    await queryRunner.query(`
      ALTER TABLE "rentals"
      DROP COLUMN IF EXISTS "owner_user_id"
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'rentals_review_status_enum'
        ) THEN
          DROP TYPE "public"."rentals_review_status_enum";
        END IF;
      END
      $$;
    `);
  }
}

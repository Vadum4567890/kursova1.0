import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOwnerApprovalStatus1776202200000 implements MigrationInterface {
  name = 'AddOwnerApprovalStatus1776202200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'rentals_owner_approval_status_enum'
        ) THEN
          CREATE TYPE "public"."rentals_owner_approval_status_enum" AS ENUM (
            'pending',
            'approved',
            'rejected'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "rentals"
      ADD COLUMN IF NOT EXISTS "owner_approval_status" "public"."rentals_owner_approval_status_enum" NOT NULL DEFAULT 'pending'
    `);

    await queryRunner.query(`
      UPDATE "rentals"
      SET "owner_approval_status" = CASE
        WHEN "status" IN ('active', 'completed') THEN 'approved'::"public"."rentals_owner_approval_status_enum"
        WHEN "status" = 'cancelled' AND COALESCE("total_cost", 0) = 0 THEN 'rejected'::"public"."rentals_owner_approval_status_enum"
        ELSE "owner_approval_status"
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "rentals"
      DROP COLUMN IF EXISTS "owner_approval_status"
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'rentals_owner_approval_status_enum'
        ) THEN
          DROP TYPE "public"."rentals_owner_approval_status_enum";
        END IF;
      END
      $$;
    `);
  }
}

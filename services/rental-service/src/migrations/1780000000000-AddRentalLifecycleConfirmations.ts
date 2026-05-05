import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRentalLifecycleConfirmations1780000000000 implements MigrationInterface {
  name = 'AddRentalLifecycleConfirmations1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."rentals_lifecycle_state_enum" AS ENUM(
          'awaiting_owner_approval',
          'awaiting_pickup',
          'pickup_partially_confirmed',
          'pickup_disputed',
          'no_show',
          'active',
          'return_due',
          'return_partially_confirmed',
          'return_disputed',
          'completed',
          'cancelled'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "rentals"
        ADD COLUMN IF NOT EXISTS "pickup_confirmed_by_owner_at" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "pickup_confirmed_by_renter_at" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "return_confirmed_by_owner_at" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "return_confirmed_by_renter_at" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "lifecycle_state" "public"."rentals_lifecycle_state_enum" NOT NULL DEFAULT 'awaiting_owner_approval',
        ADD COLUMN IF NOT EXISTS "admin_resolved_at" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "admin_resolved_by_user_id" uuid,
        ADD COLUMN IF NOT EXISTS "admin_resolution_note" character varying(1000)
    `);
    await queryRunner.query(`
      UPDATE "rentals"
      SET "lifecycle_state" = CASE
        WHEN "status" = 'completed' THEN 'completed'::"public"."rentals_lifecycle_state_enum"
        WHEN "status" = 'cancelled' THEN 'cancelled'::"public"."rentals_lifecycle_state_enum"
        WHEN "status" = 'active' THEN 'active'::"public"."rentals_lifecycle_state_enum"
        WHEN "owner_approval_status" = 'approved' THEN 'awaiting_pickup'::"public"."rentals_lifecycle_state_enum"
        ELSE 'awaiting_owner_approval'::"public"."rentals_lifecycle_state_enum"
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "rentals"
        DROP COLUMN IF EXISTS "admin_resolution_note",
        DROP COLUMN IF EXISTS "admin_resolved_by_user_id",
        DROP COLUMN IF EXISTS "admin_resolved_at",
        DROP COLUMN IF EXISTS "lifecycle_state",
        DROP COLUMN IF EXISTS "return_confirmed_by_renter_at",
        DROP COLUMN IF EXISTS "return_confirmed_by_owner_at",
        DROP COLUMN IF EXISTS "pickup_confirmed_by_renter_at",
        DROP COLUMN IF EXISTS "pickup_confirmed_by_owner_at"
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."rentals_lifecycle_state_enum"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRentalResolutions1781000000000 implements MigrationInterface {
  name = 'AddRentalResolutions1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."rental_resolutions_resolution_type_enum" AS ENUM(
          'admin_activated',
          'admin_completed',
          'renter_no_show',
          'owner_no_show',
          'mutual_cancel',
          'admin_cancel',
          'pickup_dispute',
          'return_dispute'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rental_resolutions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rental_id" uuid NOT NULL,
        "actor_user_id" uuid NOT NULL,
        "actor_role" character varying(32) NOT NULL,
        "action" character varying(64) NOT NULL,
        "resolution_type" "public"."rental_resolutions_resolution_type_enum" NOT NULL,
        "previous_status" "public"."rentals_status_enum" NOT NULL,
        "next_status" "public"."rentals_status_enum" NOT NULL,
        "previous_lifecycle_state" "public"."rentals_lifecycle_state_enum" NOT NULL,
        "next_lifecycle_state" "public"."rentals_lifecycle_state_enum" NOT NULL,
        "penalty_amount" numeric(10,2) NOT NULL DEFAULT 0,
        "deposit_refund_amount" numeric(10,2) NOT NULL DEFAULT 0,
        "note" character varying(1000),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rental_resolutions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_rental_resolutions_rental" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_rental_resolutions_rental_id" ON "rental_resolutions" ("rental_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_rental_resolutions_created_at" ON "rental_resolutions" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rental_resolutions_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rental_resolutions_rental_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rental_resolutions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."rental_resolutions_resolution_type_enum"`);
  }
}

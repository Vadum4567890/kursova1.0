import { MigrationInterface, QueryRunner } from 'typeorm';

/** Єдиний початковий дамп схеми rental DB (повторює поточні entity). */
export class InitialRentalSchema1700000000000 implements MigrationInterface {
  name = 'InitialRentalSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TYPE "public"."rentals_status_enum" AS ENUM('pending','active','completed','cancelled')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."rentals_owner_approval_status_enum" AS ENUM('pending','approved','rejected')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."rentals_review_status_enum" AS ENUM('not_available','waiting','partial','published','expired')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."rentals_lifecycle_state_enum" AS ENUM('awaiting_owner_approval','awaiting_pickup','pickup_partially_confirmed','pickup_disputed','no_show','active','return_due','return_partially_confirmed','return_disputed','completed','cancelled')`
    );

    await queryRunner.query(`
      CREATE TABLE "rentals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "car_id" uuid NOT NULL,
        "renter_user_id" uuid NOT NULL,
        "owner_user_id" uuid,
        "start_date" TIMESTAMP NOT NULL,
        "expected_end_date" TIMESTAMP NOT NULL,
        "actual_end_date" TIMESTAMP,
        "deposit_amount" numeric(10,2) NOT NULL,
        "total_cost" numeric(10,2) NOT NULL,
        "penalty_amount" numeric(10,2) NOT NULL DEFAULT 0,
        "status" "public"."rentals_status_enum" NOT NULL DEFAULT 'active',
        "owner_approval_status" "public"."rentals_owner_approval_status_enum" NOT NULL DEFAULT 'pending',
        "review_status" "public"."rentals_review_status_enum" NOT NULL DEFAULT 'not_available',
        "lifecycle_state" "public"."rentals_lifecycle_state_enum" NOT NULL DEFAULT 'awaiting_owner_approval',
        "review_window_closes_at" TIMESTAMP,
        "owner_review_submitted_at" TIMESTAMP,
        "renter_review_submitted_at" TIMESTAMP,
        "pickup_confirmed_by_owner_at" TIMESTAMP,
        "pickup_confirmed_by_renter_at" TIMESTAMP,
        "return_confirmed_by_owner_at" TIMESTAMP,
        "return_confirmed_by_renter_at" TIMESTAMP,
        "admin_resolved_at" TIMESTAMP,
        "admin_resolved_by_user_id" uuid,
        "admin_resolution_note" character varying(1000),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rentals" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "penalties" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rental_id" uuid NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "reason" character varying(500) NOT NULL,
        "date" TIMESTAMP NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_penalties" PRIMARY KEY ("id"),
        CONSTRAINT "FK_penalties_rental" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "rental_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rental_id" uuid NOT NULL,
        "sender_user_id" uuid NOT NULL,
        "body" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rental_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_rental_messages_rental" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "car_inquiry_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "car_id" uuid NOT NULL,
        "thread_renter_user_id" uuid NOT NULL,
        "sender_user_id" uuid NOT NULL,
        "body" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_car_inquiry_messages" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_car_inquiry_car_thread" ON "car_inquiry_messages" ("car_id", "thread_renter_user_id")`
    );

    await queryRunner.query(`
      CREATE TABLE "chat_read_cursors" (
        "user_id" uuid NOT NULL,
        "conversation_key" character varying(512) NOT NULL,
        "last_read_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_chat_read_cursors" PRIMARY KEY ("user_id", "conversation_key")
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "public"."reviews_review_type_enum" AS ENUM('owner_to_renter','renter_to_owner_and_car')`
    );
    await queryRunner.query(`CREATE TYPE "public"."reviews_reviewee_type_enum" AS ENUM('owner','renter')`);
    await queryRunner.query(`CREATE TYPE "public"."reviews_status_enum" AS ENUM('submitted','published','expired')`);

    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "booking_id" uuid NOT NULL,
        "reviewer_user_id" uuid NOT NULL,
        "reviewee_user_id" uuid NOT NULL,
        "car_id" uuid NOT NULL,
        "review_type" "public"."reviews_review_type_enum" NOT NULL,
        "reviewee_type" "public"."reviews_reviewee_type_enum" NOT NULL,
        "status" "public"."reviews_status_enum" NOT NULL DEFAULT 'submitted',
        "comment" text,
        "submitted_at" TIMESTAMP NOT NULL,
        "published_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reviews_booking" FOREIGN KEY ("booking_id") REFERENCES "rentals"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "review_scores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "review_id" uuid NOT NULL,
        "category_code" character varying(64) NOT NULL,
        "score" smallint NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_review_scores" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_review_scores_review_category" UNIQUE ("review_id", "category_code"),
        CONSTRAINT "FK_review_scores_review" FOREIGN KEY ("review_id") REFERENCES "reviews"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "review_scores"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."reviews_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."reviews_reviewee_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."reviews_review_type_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_read_cursors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "car_inquiry_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rental_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "penalties"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rentals"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."rentals_lifecycle_state_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."rentals_review_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."rentals_owner_approval_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."rentals_status_enum"`);
  }
}

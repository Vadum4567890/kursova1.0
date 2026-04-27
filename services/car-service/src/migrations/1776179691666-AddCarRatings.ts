import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCarRatings1776179691666 implements MigrationInterface {
    name = 'AddCarRatings1776179691666'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "car_pricing" ("car_id" uuid NOT NULL, "hourly_rate" numeric(10,2), "daily_rate" numeric(10,2) NOT NULL, "weekly_rate" numeric(10,2), "monthly_rate" numeric(10,2), "deposit_required" boolean NOT NULL DEFAULT true, "deposit_amount" numeric(10,2), "currency" character varying(3) NOT NULL DEFAULT 'UAH', "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_90c847456a564589d20368e0271" PRIMARY KEY ("car_id"))`);
        await queryRunner.query(`CREATE TABLE "car_features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "car_id" uuid NOT NULL, "feature_name" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4703c412b6d3af45fb24b9c30ab" UNIQUE ("car_id", "feature_name"), CONSTRAINT "PK_3170f28e047ca7806f4be877c45" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "car_availability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "car_id" uuid NOT NULL, "date" date NOT NULL, "is_available" boolean NOT NULL DEFAULT true, "blocked_reason" text, "blocked_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_63f967eb50d38187cd3b74cd4c3" UNIQUE ("car_id", "date"), CONSTRAINT "PK_85a37f0d6b4238591b513752a49" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "car_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "car_id" uuid NOT NULL, "image_url" text NOT NULL, "is_primary" boolean NOT NULL DEFAULT false, "display_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f7870496c0b0f5a8894cab2bde3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."car_documents_doc_type_enum" AS ENUM('registration', 'insurance', 'inspection', 'other')`);
        await queryRunner.query(`CREATE TABLE "car_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "car_id" uuid NOT NULL, "doc_type" "public"."car_documents_doc_type_enum" NOT NULL, "doc_url" text NOT NULL, "expiry_date" date, "verified" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_88709a478c9c510063587de91a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."cars_category_enum" AS ENUM('economy', 'comfort', 'premium', 'suv', 'luxury')`);
        await queryRunner.query(`CREATE TYPE "public"."cars_transmission_enum" AS ENUM('manual', 'automatic', 'cvt')`);
        await queryRunner.query(`CREATE TYPE "public"."cars_fuel_type_enum" AS ENUM('petrol', 'diesel', 'electric', 'hybrid')`);
        await queryRunner.query(`CREATE TYPE "public"."cars_status_enum" AS ENUM('active', 'inactive', 'rented', 'maintenance', 'deleted')`);
        await queryRunner.query(`CREATE TABLE "cars" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_id" uuid NOT NULL, "make" character varying(100) NOT NULL, "model" character varying(100) NOT NULL, "year" integer NOT NULL, "vin" character varying(17), "category" "public"."cars_category_enum" NOT NULL, "transmission" "public"."cars_transmission_enum" NOT NULL, "fuel_type" "public"."cars_fuel_type_enum" NOT NULL, "seats" integer NOT NULL, "mileage" integer DEFAULT '0', "color" character varying(50), "license_plate" character varying(20), "status" "public"."cars_status_enum" NOT NULL DEFAULT 'active', "description" text, "location_latitude" numeric(10,8), "location_longitude" numeric(11,8), "location_address" text, "instant_book" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1a56deecb54b4ed4917445f49e9" UNIQUE ("vin"), CONSTRAINT "PK_fc218aa84e79b477d55322271b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "car_ratings" ("car_id" uuid NOT NULL, "rating" numeric(3,2) NOT NULL DEFAULT '0', "reviewsCount" integer NOT NULL DEFAULT '0', "cleanlinessAvg" numeric(3,2) NOT NULL DEFAULT '0', "technicalConditionAvg" numeric(3,2) NOT NULL DEFAULT '0', "accuracyOfDescriptionAvg" numeric(3,2) NOT NULL DEFAULT '0', "completedRentalsCount" integer NOT NULL DEFAULT '0', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7489471b730bf2a26aadf95412d" PRIMARY KEY ("car_id"))`);
        await queryRunner.query(`ALTER TABLE "car_pricing" ADD CONSTRAINT "FK_90c847456a564589d20368e0271" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "car_features" ADD CONSTRAINT "FK_f6c3fe95b1fba28e9168c075e74" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "car_availability" ADD CONSTRAINT "FK_4716c225c5f6b31892f12c41a0c" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "car_images" ADD CONSTRAINT "FK_b656953875307b25131f0d9af94" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "car_documents" ADD CONSTRAINT "FK_b371f88994cf3fc1b027b988f71" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "car_documents" DROP CONSTRAINT "FK_b371f88994cf3fc1b027b988f71"`);
        await queryRunner.query(`ALTER TABLE "car_images" DROP CONSTRAINT "FK_b656953875307b25131f0d9af94"`);
        await queryRunner.query(`ALTER TABLE "car_availability" DROP CONSTRAINT "FK_4716c225c5f6b31892f12c41a0c"`);
        await queryRunner.query(`ALTER TABLE "car_features" DROP CONSTRAINT "FK_f6c3fe95b1fba28e9168c075e74"`);
        await queryRunner.query(`ALTER TABLE "car_pricing" DROP CONSTRAINT "FK_90c847456a564589d20368e0271"`);
        await queryRunner.query(`DROP TABLE "car_ratings"`);
        await queryRunner.query(`DROP TABLE "cars"`);
        await queryRunner.query(`DROP TYPE "public"."cars_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cars_fuel_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cars_transmission_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cars_category_enum"`);
        await queryRunner.query(`DROP TABLE "car_documents"`);
        await queryRunner.query(`DROP TYPE "public"."car_documents_doc_type_enum"`);
        await queryRunner.query(`DROP TABLE "car_images"`);
        await queryRunner.query(`DROP TABLE "car_availability"`);
        await queryRunner.query(`DROP TABLE "car_features"`);
        await queryRunner.query(`DROP TABLE "car_pricing"`);
    }

}

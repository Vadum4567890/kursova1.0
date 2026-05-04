import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1777932647840 implements MigrationInterface {
    name = 'InitialSchema1777932647840'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."cars_category_enum" AS ENUM('economy', 'comfort', 'premium', 'suv', 'luxury')`);
        await queryRunner.query(`CREATE TYPE "public"."cars_status_enum" AS ENUM('active', 'inactive', 'rented', 'maintenance')`);
        await queryRunner.query(`CREATE TABLE "cars" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ownerId" uuid NOT NULL, "brand" character varying NOT NULL, "model" character varying NOT NULL, "year" integer NOT NULL, "licensePlate" character varying NOT NULL, "vin" character varying, "category" "public"."cars_category_enum" NOT NULL DEFAULT 'economy', "bodyType" character varying, "transmission" character varying, "fuelType" character varying, "engine" character varying, "driveType" character varying, "seats" integer, "color" character varying, "mileage" integer, "description" text, "status" "public"."cars_status_enum" NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_car_licensePlate" UNIQUE ("licensePlate"), CONSTRAINT "PK_cars" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_car_ownerId" ON "cars" ("ownerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_car_brand_model" ON "cars" ("brand", "model") `);
        await queryRunner.query(`CREATE INDEX "IDX_car_status" ON "cars" ("status") `);

        await queryRunner.query(`CREATE TABLE "car_pricing" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "carId" uuid NOT NULL, "pricePerDay" numeric(10,2) NOT NULL, "deposit" numeric(10,2) NOT NULL DEFAULT '0', "currency" character varying NOT NULL DEFAULT 'UAH', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_car_pricing_carId" UNIQUE ("carId"), CONSTRAINT "PK_car_pricing" PRIMARY KEY ("id"))`);

        await queryRunner.query(`CREATE TABLE "car_features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "carId" uuid NOT NULL, "feature" character varying NOT NULL, CONSTRAINT "PK_car_features" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_car_feature_carId" ON "car_features" ("carId") `);

        await queryRunner.query(`CREATE TABLE "car_availability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "carId" uuid NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "isAvailable" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_car_availability" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_car_availability_carId" ON "car_availability" ("carId") `);
        await queryRunner.query(`CREATE INDEX "IDX_car_availability_dates" ON "car_availability" ("startDate", "endDate") `);

        await queryRunner.query(`CREATE TABLE "car_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "carId" uuid NOT NULL, "imageUrl" character varying NOT NULL, "isPrimary" boolean NOT NULL DEFAULT false, "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_car_images" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_car_image_carId" ON "car_images" ("carId") `);

        await queryRunner.query(`CREATE TYPE "public"."car_documents_doctype_enum" AS ENUM('registration', 'insurance', 'inspection', 'other')`);
        await queryRunner.query(`CREATE TABLE "car_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "carId" uuid NOT NULL, "docType" "public"."car_documents_doctype_enum" NOT NULL, "docNumber" character varying, "fileUrl" character varying NOT NULL, "expiryDate" date, "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_car_documents" PRIMARY KEY ("id"))`);

        await queryRunner.query(`CREATE TABLE "car_ratings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "carId" uuid NOT NULL, "averageRating" numeric(3,2) NOT NULL DEFAULT '0', "totalReviews" integer NOT NULL DEFAULT '0', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_car_rating_carId" UNIQUE ("carId"), CONSTRAINT "PK_car_ratings" PRIMARY KEY ("id"))`);

        await queryRunner.query(`ALTER TABLE "car_pricing" ADD CONSTRAINT "FK_car_pricing_carId" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "car_features" ADD CONSTRAINT "FK_car_feature_carId" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "car_availability" ADD CONSTRAINT "FK_car_availability_carId" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "car_images" ADD CONSTRAINT "FK_car_image_carId" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "car_documents" ADD CONSTRAINT "FK_car_document_carId" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "car_ratings" ADD CONSTRAINT "FK_car_rating_carId" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "car_ratings" DROP CONSTRAINT "FK_car_rating_carId"`);
        await queryRunner.query(`ALTER TABLE "car_documents" DROP CONSTRAINT "FK_car_document_carId"`);
        await queryRunner.query(`ALTER TABLE "car_images" DROP CONSTRAINT "FK_car_image_carId"`);
        await queryRunner.query(`ALTER TABLE "car_availability" DROP CONSTRAINT "FK_car_availability_carId"`);
        await queryRunner.query(`ALTER TABLE "car_features" DROP CONSTRAINT "FK_car_feature_carId"`);
        await queryRunner.query(`ALTER TABLE "car_pricing" DROP CONSTRAINT "FK_car_pricing_carId"`);

        await queryRunner.query(`DROP TABLE "car_ratings"`);
        await queryRunner.query(`DROP TABLE "car_documents"`);
        await queryRunner.query(`DROP TYPE "public"."car_documents_doctype_enum"`);
        await queryRunner.query(`DROP TABLE "car_images"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_car_image_carId"`);
        await queryRunner.query(`DROP TABLE "car_availability"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_car_availability_dates"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_car_availability_carId"`);
        await queryRunner.query(`DROP TABLE "car_features"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_car_feature_carId"`);
        await queryRunner.query(`DROP TABLE "car_pricing"`);
        await queryRunner.query(`DROP TABLE "cars"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_car_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_car_brand_model"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_car_ownerId"`);
        await queryRunner.query(`DROP TYPE "public"."cars_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cars_category_enum"`);
    }

}

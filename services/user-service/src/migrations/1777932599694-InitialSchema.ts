import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1777932599694 implements MigrationInterface {
    name = 'InitialSchema1777932599694'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_accounts_role_enum" AS ENUM('admin', 'manager', 'employee', 'renter', 'owner', 'both')`);
        await queryRunner.query(`CREATE TYPE "public"."user_accounts_verifiedstatus_enum" AS ENUM('unverified', 'pending', 'verified', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "user_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying, "role" "public"."user_accounts_role_enum" NOT NULL DEFAULT 'renter', "isActive" boolean NOT NULL DEFAULT true, "verifiedStatus" "public"."user_accounts_verifiedstatus_enum" NOT NULL DEFAULT 'unverified', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_user_email" UNIQUE ("email"), CONSTRAINT "PK_user_accounts" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_user_email" ON "user_accounts" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_role" ON "user_accounts" ("role") `);

        await queryRunner.query(`CREATE TABLE "user_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "fullName" character varying NOT NULL, "phone" character varying, "address" text, "dateOfBirth" date, "driverLicenseNumber" character varying, "passportNumber" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_user_profile_userId" UNIQUE ("userId"), CONSTRAINT "PK_user_profiles" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_user_profile_fullName" ON "user_profiles" ("fullName") `);

        await queryRunner.query(`CREATE TYPE "public"."user_documents_doctype_enum" AS ENUM('passport', 'driver_license', 'id_card', 'other')`);
        await queryRunner.query(`CREATE TABLE "user_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "docType" "public"."user_documents_doctype_enum" NOT NULL, "docNumber" character varying, "fileUrl" character varying NOT NULL, "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_user_documents" PRIMARY KEY ("id"))`);

        await queryRunner.query(`CREATE TABLE "user_ratings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "averageRating" numeric(3,2) NOT NULL DEFAULT '0', "totalReviews" integer NOT NULL DEFAULT '0', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_user_rating_userId" UNIQUE ("userId"), CONSTRAINT "PK_user_ratings" PRIMARY KEY ("id"))`);

        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_user_profile_userId" FOREIGN KEY ("userId") REFERENCES "user_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_documents" ADD CONSTRAINT "FK_user_document_userId" FOREIGN KEY ("userId") REFERENCES "user_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_ratings" ADD CONSTRAINT "FK_user_rating_userId" FOREIGN KEY ("userId") REFERENCES "user_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_ratings" DROP CONSTRAINT "FK_user_rating_userId"`);
        await queryRunner.query(`ALTER TABLE "user_documents" DROP CONSTRAINT "FK_user_document_userId"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_user_profile_userId"`);

        await queryRunner.query(`DROP TABLE "user_ratings"`);
        await queryRunner.query(`DROP TABLE "user_documents"`);
        await queryRunner.query(`DROP TYPE "public"."user_documents_doctype_enum"`);
        await queryRunner.query(`DROP TABLE "user_profiles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_profile_fullName"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_role"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_email"`);
        await queryRunner.query(`DROP TABLE "user_accounts"`);
        await queryRunner.query(`DROP TYPE "public"."user_accounts_verifiedstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_accounts_role_enum"`);
    }

}

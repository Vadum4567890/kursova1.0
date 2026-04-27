import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRatingAggregates1776179691504 implements MigrationInterface {
    name = 'AddRatingAggregates1776179691504'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_profiles" ("userId" uuid NOT NULL, "firstName" character varying(100), "lastName" character varying(100), "birthDate" date, "address" text, "city" character varying(100), "country" character varying(100) NOT NULL DEFAULT 'Ukraine', "avatarUrl" text, "bio" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "REL_6ca9503d77ae39b4b5a6cc3ba8" UNIQUE ("user_id"), CONSTRAINT "PK_8481388d6325e752cd4d7e26c6d" PRIMARY KEY ("userId"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_documents_doctype_enum" AS ENUM('passport', 'driving_license', 'tax_id', 'other')`);
        await queryRunner.query(`CREATE TABLE "user_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "docType" "public"."user_documents_doctype_enum" NOT NULL, "docNumber" character varying(100), "docImageUrl" text, "verified" boolean NOT NULL DEFAULT false, "verifiedAt" TIMESTAMP, "verifiedBy" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_cea43819156528b63504c4afd4b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_ratings" ("userId" uuid NOT NULL, "rating" numeric(3,2) NOT NULL DEFAULT '0', "reviewsCount" integer NOT NULL DEFAULT '0', "asRenterRating" numeric(3,2) NOT NULL DEFAULT '0', "asRenterCount" integer NOT NULL DEFAULT '0', "asOwnerRating" numeric(3,2) NOT NULL DEFAULT '0', "asOwnerCount" integer NOT NULL DEFAULT '0', "ownerCommunicationAvg" numeric(3,2) NOT NULL DEFAULT '0', "ownerHonestyAvg" numeric(3,2) NOT NULL DEFAULT '0', "ownerResponseSpeedAvg" numeric(3,2) NOT NULL DEFAULT '0', "renterReturnedOnTimeAvg" numeric(3,2) NOT NULL DEFAULT '0', "renterDamageFreeReturnAvg" numeric(3,2) NOT NULL DEFAULT '0', "renterBehaviorAvg" numeric(3,2) NOT NULL DEFAULT '0', "completedRentalsCount" integer NOT NULL DEFAULT '0', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "REL_a6702517a0507bdd68aa6707dd" UNIQUE ("user_id"), CONSTRAINT "PK_93e09460114f90dcff1371ebb0d" PRIMARY KEY ("userId"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_accounts_role_enum" AS ENUM('renter', 'owner', 'both', 'admin')`);
        await queryRunner.query(`CREATE TYPE "public"."user_accounts_verifiedstatus_enum" AS ENUM('pending', 'verified', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "user_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "phone" character varying(20), "role" "public"."user_accounts_role_enum" NOT NULL DEFAULT 'renter', "verifiedStatus" "public"."user_accounts_verifiedstatus_enum" NOT NULL DEFAULT 'pending', "emailVerified" boolean NOT NULL DEFAULT false, "phoneVerified" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_df3802ec9c31dd9491e3589378d" UNIQUE ("email"), CONSTRAINT "UQ_4117066be077cd108924fabc748" UNIQUE ("phone"), CONSTRAINT "PK_125e915cf23ad1cfb43815ce59b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88" FOREIGN KEY ("user_id") REFERENCES "user_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_documents" ADD CONSTRAINT "FK_aa4b82a9943c65b5f622a6925b2" FOREIGN KEY ("user_id") REFERENCES "user_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_ratings" ADD CONSTRAINT "FK_a6702517a0507bdd68aa6707dde" FOREIGN KEY ("user_id") REFERENCES "user_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_ratings" DROP CONSTRAINT "FK_a6702517a0507bdd68aa6707dde"`);
        await queryRunner.query(`ALTER TABLE "user_documents" DROP CONSTRAINT "FK_aa4b82a9943c65b5f622a6925b2"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88"`);
        await queryRunner.query(`DROP TABLE "user_accounts"`);
        await queryRunner.query(`DROP TYPE "public"."user_accounts_verifiedstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_accounts_role_enum"`);
        await queryRunner.query(`DROP TABLE "user_ratings"`);
        await queryRunner.query(`DROP TABLE "user_documents"`);
        await queryRunner.query(`DROP TYPE "public"."user_documents_doctype_enum"`);
        await queryRunner.query(`DROP TABLE "user_profiles"`);
    }

}

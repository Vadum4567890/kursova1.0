import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordAuth1778000000000 implements MigrationInterface {
  name = 'AddPasswordAuth1778000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_accounts" ADD COLUMN IF NOT EXISTS "username" varchar(100)`);
    await queryRunner.query(`ALTER TABLE "user_accounts" ADD COLUMN IF NOT EXISTS "password_hash" text`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_accounts_username" ON "user_accounts" ("username") WHERE "username" IS NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_accounts_username"`);
    await queryRunner.query(`ALTER TABLE "user_accounts" DROP COLUMN IF EXISTS "password_hash"`);
    await queryRunner.query(`ALTER TABLE "user_accounts" DROP COLUMN IF EXISTS "username"`);
  }
}

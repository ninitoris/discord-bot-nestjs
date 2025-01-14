import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1736785350304 implements MigrationInterface {
    name = 'Auto1736785350304'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "telegramID"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "telegramID" bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "telegramID"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "telegramID" integer`);
    }

}

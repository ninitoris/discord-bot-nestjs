import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1730366722304 implements MigrationInterface {
    name = 'Auto1730366722304'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "female" boolean NOT NULL DEFAULT false, "orgID" character varying, "gitlabID" integer NOT NULL, "gitlabName" character varying NOT NULL, "discordID" character varying, "telegramID" integer, "telegramUsername" character varying, "createdBy" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_settings" ("id" SERIAL NOT NULL, "useTelegram" boolean NOT NULL DEFAULT false, "useDiscord" boolean NOT NULL DEFAULT false, "tgGroupChatNotify" boolean NOT NULL DEFAULT false, "tgPrivateMessageNotify" boolean NOT NULL DEFAULT false, "userId" integer, CONSTRAINT "REL_986a2b6d3c05eb4091bb8066f7" UNIQUE ("userId"), CONSTRAINT "PK_00f004f5922a0744d174530d639" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_settings" ADD CONSTRAINT "FK_986a2b6d3c05eb4091bb8066f78" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_settings" DROP CONSTRAINT "FK_986a2b6d3c05eb4091bb8066f78"`);
        await queryRunner.query(`DROP TABLE "user_settings"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}

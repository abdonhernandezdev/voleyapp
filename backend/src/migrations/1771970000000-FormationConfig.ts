import { MigrationInterface, QueryRunner } from 'typeorm';

export class FormationConfig1771970000000 implements MigrationInterface {
  name = 'FormationConfig1771970000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "formation_zone_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "gameFamily" character varying(20) NOT NULL,
        "system" character varying(10),
        "idx" integer NOT NULL,
        "playerId" integer NOT NULL,
        "x" double precision NOT NULL,
        "y" double precision NOT NULL,
        "w" double precision NOT NULL,
        "h" double precision NOT NULL,
        "updatedBy" uuid,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_formation_zone_configs_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_formation_zone_family_system_idx_player"
      ON "formation_zone_configs" ("gameFamily", "system", "idx", "playerId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_formation_zone_family_system"
      ON "formation_zone_configs" ("gameFamily", "system");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_formation_zone_family_system"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_formation_zone_family_system_idx_player"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "formation_zone_configs"`);
  }
}

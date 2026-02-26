import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScoringPolicy1771950000000 implements MigrationInterface {
  name = 'ScoringPolicy1771950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'score_events_game_enum') THEN
          CREATE TYPE "public"."score_events_game_enum" AS ENUM(
            'quiz',
            'defense_zone',
            'reception_5_1',
            'duel',
            'role_reception',
            'role_defense'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'score_events_gametype_enum') THEN
          CREATE TYPE "public"."score_events_gametype_enum" AS ENUM('general', 'individual');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "score_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "game" "public"."score_events_game_enum" NOT NULL,
        "gameType" "public"."score_events_gametype_enum" NOT NULL,
        "rawPoints" integer NOT NULL DEFAULT 0,
        "normalizedPoints" integer NOT NULL DEFAULT 0,
        "awardedPoints" integer NOT NULL DEFAULT 0,
        "dailyAwardLimit" integer,
        "awardedCountToday" integer NOT NULL DEFAULT 0,
        "dailyCapApplied" boolean NOT NULL DEFAULT false,
        "source" character varying,
        "sourceId" character varying,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_score_events_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_score_events_userId"
      ON "score_events" ("userId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_score_events_user_game_createdAt"
      ON "score_events" ("userId", "game", "createdAt");
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_score_events_userId_users_id'
        ) THEN
          ALTER TABLE "score_events"
            ADD CONSTRAINT "FK_score_events_userId_users_id"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "score_events"
      DROP CONSTRAINT IF EXISTS "FK_score_events_userId_users_id";
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_score_events_user_game_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_score_events_userId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "score_events"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."score_events_gametype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."score_events_game_enum"`);
  }
}


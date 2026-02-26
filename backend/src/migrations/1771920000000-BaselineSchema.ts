import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineSchema1771920000000 implements MigrationInterface {
  name = 'BaselineSchema1771920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
          CREATE TYPE "public"."users_role_enum" AS ENUM('player', 'coach');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'questions_type_enum') THEN
          CREATE TYPE "public"."questions_type_enum" AS ENUM('quiz', 'field_drag', 'rotation');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'questions_category_enum') THEN
          CREATE TYPE "public"."questions_category_enum" AS ENUM(
            'rotations_k1',
            'rotations_k2',
            'positions_roles',
            'game_systems',
            'basic_rules'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'questions_difficulty_enum') THEN
          CREATE TYPE "public"."questions_difficulty_enum" AS ENUM('easy', 'medium', 'hard');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_sessions_mode_enum') THEN
          CREATE TYPE "public"."game_sessions_mode_enum" AS ENUM('quick', 'category', 'challenge');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_sessions_category_enum') THEN
          CREATE TYPE "public"."game_sessions_category_enum" AS ENUM(
            'rotations_k1',
            'rotations_k2',
            'positions_roles',
            'game_systems',
            'basic_rules'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "displayName" character varying,
        "avatarEmoji" character varying,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'player',
        "totalPoints" integer NOT NULL DEFAULT 0,
        "gamesPlayed" integer NOT NULL DEFAULT 0,
        "sessionsWon" integer NOT NULL DEFAULT 0,
        "streak" integer NOT NULL DEFAULT 0,
        "maxStreak" integer NOT NULL DEFAULT 0,
        "lastPlayedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_username" ON "users" ("username");
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_email" ON "users" ("email");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "questions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."questions_type_enum" NOT NULL,
        "category" "public"."questions_category_enum" NOT NULL,
        "difficulty" "public"."questions_difficulty_enum" NOT NULL DEFAULT 'easy',
        "question" character varying NOT NULL,
        "explanation" text,
        "options" jsonb,
        "correctOptionIndex" integer,
        "fieldConfig" jsonb,
        "rotationConfig" jsonb,
        "timesAnswered" integer NOT NULL DEFAULT 0,
        "timesCorrect" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_questions_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "game_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "mode" "public"."game_sessions_mode_enum" NOT NULL DEFAULT 'quick',
        "category" "public"."game_sessions_category_enum",
        "totalQuestions" integer NOT NULL DEFAULT 0,
        "correctAnswers" integer NOT NULL DEFAULT 0,
        "pointsEarned" integer NOT NULL DEFAULT 0,
        "timeSpentSeconds" integer NOT NULL DEFAULT 0,
        "questionIds" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "answers" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "completed" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_game_sessions_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_game_sessions_userId_users_id'
        ) THEN
          ALTER TABLE "game_sessions"
            ADD CONSTRAINT "FK_game_sessions_userId_users_id"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_6fafb2f50848b51f214a1cbce2" ON "game_sessions" ("userId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_6fafb2f50848b51f214a1cbce2"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_username"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_email"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "game_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "questions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."game_sessions_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."game_sessions_mode_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."questions_difficulty_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."questions_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."questions_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);
  }
}

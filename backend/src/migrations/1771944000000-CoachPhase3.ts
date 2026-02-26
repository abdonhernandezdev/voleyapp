import { MigrationInterface, QueryRunner } from 'typeorm';

export class CoachPhase31771944000000 implements MigrationInterface {
  name = 'CoachPhase31771944000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "questions"
      ADD COLUMN IF NOT EXISTS "isCustom" boolean NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      ALTER TABLE "questions"
      ADD COLUMN IF NOT EXISTS "createdByCoachId" uuid NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_questions_createdByCoachId"
      ON "questions" ("createdByCoachId");
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coach_assignments_targettype_enum') THEN
          CREATE TYPE "public"."coach_assignments_targettype_enum" AS ENUM('all_players', 'player');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coach_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coachId" uuid NOT NULL,
        "title" character varying(120) NOT NULL,
        "description" text,
        "mode" "public"."game_sessions_mode_enum" NOT NULL,
        "category" "public"."questions_category_enum",
        "targetType" "public"."coach_assignments_targettype_enum" NOT NULL DEFAULT 'all_players',
        "targetUserId" uuid,
        "dueDate" date,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_coach_assignments_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_coach_assignments_coachId"
      ON "coach_assignments" ("coachId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_coach_assignments_targetUserId"
      ON "coach_assignments" ("targetUserId");
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_coach_assignments_coachId_users_id'
        ) THEN
          ALTER TABLE "coach_assignments"
            ADD CONSTRAINT "FK_coach_assignments_coachId_users_id"
            FOREIGN KEY ("coachId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_coach_assignments_targetUserId_users_id'
        ) THEN
          ALTER TABLE "coach_assignments"
            ADD CONSTRAINT "FK_coach_assignments_targetUserId_users_id"
            FOREIGN KEY ("targetUserId") REFERENCES "users"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_coach_assignments_targetUserId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_coach_assignments_coachId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_questions_createdByCoachId"`);

    await queryRunner.query(`
      ALTER TABLE "coach_assignments"
      DROP CONSTRAINT IF EXISTS "FK_coach_assignments_targetUserId_users_id";
    `);
    await queryRunner.query(`
      ALTER TABLE "coach_assignments"
      DROP CONSTRAINT IF EXISTS "FK_coach_assignments_coachId_users_id";
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "coach_assignments"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."coach_assignments_targettype_enum"`);

    await queryRunner.query(`
      ALTER TABLE "questions"
      DROP COLUMN IF EXISTS "createdByCoachId";
    `);
    await queryRunner.query(`
      ALTER TABLE "questions"
      DROP COLUMN IF EXISTS "isCustom";
    `);
  }
}

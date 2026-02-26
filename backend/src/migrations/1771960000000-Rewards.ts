import { MigrationInterface, QueryRunner } from 'typeorm';

export class Rewards1771960000000 implements MigrationInterface {
  name = 'Rewards1771960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reward_redemptions_status_enum') THEN
          CREATE TYPE "public"."reward_redemptions_status_enum" AS ENUM('pending', 'delivered', 'cancelled');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rewards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coachId" uuid NOT NULL,
        "name" character varying(120) NOT NULL,
        "description" text,
        "pointCost" integer NOT NULL CHECK ("pointCost" >= 1),
        "stock" integer CHECK ("stock" >= 0),
        "stockUsed" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rewards_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_rewards_coachId"
      ON "rewards" ("coachId");
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_rewards_coachId_users_id'
        ) THEN
          ALTER TABLE "rewards"
            ADD CONSTRAINT "FK_rewards_coachId_users_id"
            FOREIGN KEY ("coachId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reward_redemptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rewardId" uuid NOT NULL,
        "playerId" uuid NOT NULL,
        "status" "public"."reward_redemptions_status_enum" NOT NULL DEFAULT 'pending',
        "pointsSpent" integer NOT NULL,
        "redeemedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deliveredAt" TIMESTAMPTZ,
        "cancelledAt" TIMESTAMPTZ,
        "notes" text,
        CONSTRAINT "PK_reward_redemptions_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_redemptions_playerId"
      ON "reward_redemptions" ("playerId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_redemptions_rewardId"
      ON "reward_redemptions" ("rewardId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_redemptions_status"
      ON "reward_redemptions" ("status");
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_redemptions_rewardId_rewards_id'
        ) THEN
          ALTER TABLE "reward_redemptions"
            ADD CONSTRAINT "FK_redemptions_rewardId_rewards_id"
            FOREIGN KEY ("rewardId") REFERENCES "rewards"("id")
            ON DELETE RESTRICT ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_redemptions_playerId_users_id'
        ) THEN
          ALTER TABLE "reward_redemptions"
            ADD CONSTRAINT "FK_redemptions_playerId_users_id"
            FOREIGN KEY ("playerId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type
          WHERE typname = 'score_events_game_enum'
        ) THEN RETURN; END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'score_events_game_enum')
          AND enumlabel = 'reception_4_2'
        ) THEN
          ALTER TYPE "public"."score_events_game_enum" ADD VALUE 'reception_4_2';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'score_events_game_enum')
          AND enumlabel = 'reception_6_2'
        ) THEN
          ALTER TYPE "public"."score_events_game_enum" ADD VALUE 'reception_6_2';
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reward_redemptions"
      DROP CONSTRAINT IF EXISTS "FK_redemptions_playerId_users_id";
    `);
    await queryRunner.query(`
      ALTER TABLE "reward_redemptions"
      DROP CONSTRAINT IF EXISTS "FK_redemptions_rewardId_rewards_id";
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_redemptions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_redemptions_rewardId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_redemptions_playerId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reward_redemptions"`);

    await queryRunner.query(`
      ALTER TABLE "rewards"
      DROP CONSTRAINT IF EXISTS "FK_rewards_coachId_users_id";
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rewards_coachId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rewards"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."reward_redemptions_status_enum"`);
  }
}

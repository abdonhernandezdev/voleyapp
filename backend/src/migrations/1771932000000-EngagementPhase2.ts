import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class EngagementPhase21771932000000 implements MigrationInterface {
  name = 'EngagementPhase21771932000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('users')) {
      const users = await queryRunner.getTable('users');
      const hasReminderFlag = !!users?.findColumnByName('streakReminderEmailEnabled');

      if (!hasReminderFlag) {
        await queryRunner.addColumn(
          'users',
          new TableColumn({
            name: 'streakReminderEmailEnabled',
            type: 'boolean',
            isNullable: false,
            default: 'false',
          }),
        );
      }
    }

    if (!(await queryRunner.hasTable('user_achievements'))) {
      await queryRunner.createTable(
        new Table({
          name: 'user_achievements',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
            },
            {
              name: 'userId',
              type: 'uuid',
            },
            {
              name: 'code',
              type: 'character varying',
              length: '80',
            },
            {
              name: 'unlockedAt',
              type: 'timestamp',
              default: 'now()',
            },
          ],
          uniques: [
            {
              name: 'UQ_user_achievements_user_code',
              columnNames: ['userId', 'code'],
            },
          ],
        }),
      );
    }

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_achievements_userId" ON "user_achievements" ("userId")`,
    );

    const achievementsTable = await queryRunner.getTable('user_achievements');
    const hasAchievementsFk = achievementsTable?.foreignKeys.some(
      (fk) => fk.name === 'FK_user_achievements_userId_users_id',
    );
    if (achievementsTable && !hasAchievementsFk) {
      await queryRunner.createForeignKey(
        'user_achievements',
        new TableForeignKey({
          name: 'FK_user_achievements_userId_users_id',
          columnNames: ['userId'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'NO ACTION',
        }),
      );
    }

    if (!(await queryRunner.hasTable('streak_reminder_logs'))) {
      await queryRunner.createTable(
        new Table({
          name: 'streak_reminder_logs',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
            },
            {
              name: 'userId',
              type: 'uuid',
            },
            {
              name: 'reminderDate',
              type: 'date',
            },
            {
              name: 'channel',
              type: 'character varying',
              default: `'email'`,
            },
            {
              name: 'status',
              type: 'character varying',
              default: `'sent'`,
            },
            {
              name: 'errorMessage',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              default: 'now()',
            },
          ],
          uniques: [
            {
              name: 'UQ_streak_reminder_user_day',
              columnNames: ['userId', 'reminderDate'],
            },
          ],
        }),
      );
    }

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_streak_reminder_logs_userId" ON "streak_reminder_logs" ("userId")`,
    );

    const reminderTable = await queryRunner.getTable('streak_reminder_logs');
    const hasReminderFk = reminderTable?.foreignKeys.some(
      (fk) => fk.name === 'FK_streak_reminder_logs_userId_users_id',
    );
    if (reminderTable && !hasReminderFk) {
      await queryRunner.createForeignKey(
        'streak_reminder_logs',
        new TableForeignKey({
          name: 'FK_streak_reminder_logs_userId_users_id',
          columnNames: ['userId'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'NO ACTION',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_streak_reminder_logs_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_achievements_userId"`);

    if (await queryRunner.hasTable('streak_reminder_logs')) {
      await queryRunner.query(
        `ALTER TABLE "streak_reminder_logs" DROP CONSTRAINT IF EXISTS "FK_streak_reminder_logs_userId_users_id"`,
      );
      await queryRunner.dropTable('streak_reminder_logs');
    }

    if (await queryRunner.hasTable('user_achievements')) {
      await queryRunner.query(
        `ALTER TABLE "user_achievements" DROP CONSTRAINT IF EXISTS "FK_user_achievements_userId_users_id"`,
      );
      await queryRunner.dropTable('user_achievements');
    }

    if (await queryRunner.hasTable('users')) {
      const users = await queryRunner.getTable('users');
      const hasReminderFlag = !!users?.findColumnByName('streakReminderEmailEnabled');
      if (hasReminderFlag) {
        await queryRunner.dropColumn('users', 'streakReminderEmailEnabled');
      }
    }
  }
}

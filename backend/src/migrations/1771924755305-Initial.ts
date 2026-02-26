import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class Initial1771924755305 implements MigrationInterface {
  name = 'Initial1771924755305';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('users')) {
      const usersTable = await queryRunner.getTable('users');
      const hasCorrectAnswers = !!usersTable?.findColumnByName('correctAnswers');
      const hasSessionsWon = !!usersTable?.findColumnByName('sessionsWon');

      if (hasCorrectAnswers && !hasSessionsWon) {
        await queryRunner.renameColumn('users', 'correctAnswers', 'sessionsWon');
      }

      if (!hasCorrectAnswers && !hasSessionsWon) {
        await queryRunner.addColumn(
          'users',
          new TableColumn({
            name: 'sessionsWon',
            type: 'integer',
            isNullable: false,
            default: '0',
          }),
        );
      }
    }

    if (await queryRunner.hasTable('game_sessions')) {
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_6fafb2f50848b51f214a1cbce2" ON "game_sessions" ("userId")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_6fafb2f50848b51f214a1cbce2"`);

    if (await queryRunner.hasTable('users')) {
      const usersTable = await queryRunner.getTable('users');
      const hasCorrectAnswers = !!usersTable?.findColumnByName('correctAnswers');
      const hasSessionsWon = !!usersTable?.findColumnByName('sessionsWon');

      if (!hasCorrectAnswers && hasSessionsWon) {
        await queryRunner.renameColumn('users', 'sessionsWon', 'correctAnswers');
      }
    }
  }
}

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Question } from './questions/question.entity';
import { GameSession } from './game-sessions/game-session.entity';
import { UserAchievement } from './achievements/user-achievement.entity';
import { StreakReminderLog } from './notifications/streak-reminder-log.entity';
import { CoachAssignment } from './coach/coach-assignment.entity';
import { ScoreEvent } from './scoring/score-event.entity';
import { FormationZoneConfig } from './formation-config/formation-zone-config.entity';
import { envConfig } from './config/env.config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: envConfig.database.host,
  port: envConfig.database.port,
  username: envConfig.database.user,
  password: envConfig.database.password,
  database: envConfig.database.name,
  entities: [
    User,
    Question,
    GameSession,
    UserAchievement,
    StreakReminderLog,
    CoachAssignment,
    ScoreEvent,
    FormationZoneConfig,
  ],
  migrations: [__dirname + '/migrations/*.js', __dirname + '/migrations/*.ts'],
  ssl: envConfig.database.sslEnabled
    ? { rejectUnauthorized: envConfig.database.sslRejectUnauthorized }
    : false,
});

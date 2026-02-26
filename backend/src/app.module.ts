import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { QuestionsModule } from './questions/questions.module';
import { GameSessionsModule } from './game-sessions/game-sessions.module';
import { RankingsModule } from './rankings/rankings.module';
import { TrainingModule } from './training/training.module';
import { envConfig } from './config/env.config';
import { AchievementsModule } from './achievements/achievements.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DuelsModule } from './duels/duels.module';
import { CoachModule } from './coach/coach.module';
import { ScoringModule } from './scoring/scoring.module';
import { RewardsModule } from './rewards/rewards.module';
import { FormationConfigModule } from './formation-config/formation-config.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: envConfig.security.rateLimit.globalTtlMs,
        limit: envConfig.security.rateLimit.globalLimit,
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envConfig.database.host,
      port: envConfig.database.port,
      username: envConfig.database.user,
      password: envConfig.database.password,
      database: envConfig.database.name,
      autoLoadEntities: true,
      synchronize: envConfig.database.synchronize,
      migrations: [__dirname + '/migrations/*.js', __dirname + '/migrations/*.ts'],
      migrationsRun: envConfig.database.migrationsRun,
      ssl: envConfig.database.sslEnabled
        ? { rejectUnauthorized: envConfig.database.sslRejectUnauthorized }
        : false,
    }),
    AuthModule,
    UsersModule,
    QuestionsModule,
    GameSessionsModule,
    RankingsModule,
    TrainingModule,
    AchievementsModule,
    NotificationsModule,
    DuelsModule,
    CoachModule,
    ScoringModule,
    RewardsModule,
    FormationConfigModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

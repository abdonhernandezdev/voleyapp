import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAchievement } from './entities/user-achievement.entity';
import { AchievementsService } from './services/achievements.service';
import { AchievementEvaluatorService } from './services/achievement-evaluator.service';
import { AchievementsController } from './achievements.controller';
import { GameSession } from '../game-sessions/game-session.entity';
import { User } from '../users/user.entity';
import { ScoreEvent } from '../scoring/score-event.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserAchievement, GameSession, User, ScoreEvent]), UsersModule],
  providers: [AchievementsService, AchievementEvaluatorService],
  controllers: [AchievementsController],
  exports: [AchievementsService],
})
export class AchievementsModule {}

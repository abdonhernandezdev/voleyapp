import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameSession } from './entities/game-session.entity';
import { GameSessionsService } from './game-sessions.service';
import { GameSessionsController } from './game-sessions.controller';
import { QuestionsModule } from '../questions/questions.module';
import { UsersModule } from '../users/users.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameSession]),
    QuestionsModule,
    UsersModule,
    AchievementsModule,
    ScoringModule,
  ],
  providers: [GameSessionsService],
  controllers: [GameSessionsController],
  exports: [GameSessionsService],
})
export class GameSessionsModule {}

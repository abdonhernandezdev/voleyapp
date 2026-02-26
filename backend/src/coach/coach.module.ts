import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachController } from './coach.controller';
import { PlayerAssignmentsController } from './player-assignments.controller';
import { CoachService } from './services/coach.service';
import { CoachQuestionsService } from './services/coach-questions.service';
import { CoachAssignmentsService } from './services/coach-assignments.service';
import { CoachAnalyticsService } from './services/coach-analytics.service';
import { Question } from '../questions/question.entity';
import { User } from '../users/user.entity';
import { GameSession } from '../game-sessions/game-session.entity';
import { CoachAssignment } from './entities/coach-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question, User, GameSession, CoachAssignment])],
  providers: [CoachService, CoachQuestionsService, CoachAssignmentsService, CoachAnalyticsService],
  controllers: [CoachController, PlayerAssignmentsController],
  exports: [CoachService],
})
export class CoachModule {}

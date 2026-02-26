import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../users/user.entity';
import {
  CoachAssignmentWithProgress,
  CoachPlayerAnalytics,
  CoachQuestionItem,
  PlayerAssignmentItem,
} from '../coach.types';
import { CreateCoachQuestionDto, UpdateCoachQuestionDto } from '../dto/coach-question.dto';
import {
  CoachAnalyticsQueryDto,
  CreateCoachAssignmentDto,
  UpdateCoachAssignmentDto,
} from '../dto/coach-assignment.dto';
import { CoachQuestionsService } from './coach-questions.service';
import { CoachAssignmentsService } from './coach-assignments.service';
import { CoachAnalyticsService } from './coach-analytics.service';

@Injectable()
export class CoachService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly questionsService: CoachQuestionsService,
    private readonly assignmentsService: CoachAssignmentsService,
    private readonly analyticsService: CoachAnalyticsService,
  ) {}

  async getPlayers(): Promise<User[]> {
    return this.userRepo.find({
      where: { role: UserRole.PLAYER },
      select: [
        'id',
        'username',
        'displayName',
        'avatarEmoji',
        'totalPoints',
        'gamesPlayed',
        'sessionsWon',
        'streak',
        'maxStreak',
        'lastPlayedAt',
      ],
      order: { totalPoints: 'DESC' },
    });
  }

  getQuestionsForCoach(coachId: string, includeInactive = false): Promise<CoachQuestionItem[]> {
    return this.questionsService.getQuestionsForCoach(coachId, includeInactive);
  }

  createQuestionForCoach(coachId: string, dto: CreateCoachQuestionDto): Promise<CoachQuestionItem> {
    return this.questionsService.createQuestionForCoach(coachId, dto);
  }

  updateQuestionForCoach(coachId: string, questionId: string, dto: UpdateCoachQuestionDto): Promise<CoachQuestionItem> {
    return this.questionsService.updateQuestionForCoach(coachId, questionId, dto);
  }

  deactivateQuestionForCoach(coachId: string, questionId: string): Promise<{ ok: true }> {
    return this.questionsService.deactivateQuestionForCoach(coachId, questionId);
  }

  deleteQuestionForCoach(coachId: string, questionId: string): Promise<{ ok: true }> {
    return this.questionsService.deleteQuestionForCoach(coachId, questionId);
  }

  createAssignment(coachId: string, dto: CreateCoachAssignmentDto): Promise<CoachAssignmentWithProgress> {
    return this.assignmentsService.createAssignment(coachId, dto);
  }

  updateAssignment(coachId: string, assignmentId: string, dto: UpdateCoachAssignmentDto): Promise<CoachAssignmentWithProgress> {
    return this.assignmentsService.updateAssignment(coachId, assignmentId, dto);
  }

  deactivateAssignment(coachId: string, assignmentId: string): Promise<{ ok: true }> {
    return this.assignmentsService.deactivateAssignment(coachId, assignmentId);
  }

  getAssignmentsForCoach(coachId: string): Promise<CoachAssignmentWithProgress[]> {
    return this.assignmentsService.getAssignmentsForCoach(coachId);
  }

  getAssignmentsForPlayer(userId: string): Promise<PlayerAssignmentItem[]> {
    return this.assignmentsService.getAssignmentsForPlayer(userId);
  }

  getAssignmentProgressForCoach(coachId: string, assignmentId: string): Promise<CoachAssignmentWithProgress> {
    return this.assignmentsService.getAssignmentProgressForCoach(coachId, assignmentId);
  }

  getPlayerAnalytics(coachId: string, playerId: string, query: CoachAnalyticsQueryDto): Promise<CoachPlayerAnalytics> {
    return this.analyticsService.getPlayerAnalytics(coachId, playerId, query);
  }

  exportPlayerReportPdf(coachId: string, playerId: string): Promise<{ filename: string; buffer: Buffer }> {
    return this.analyticsService.exportPlayerReportPdf(coachId, playerId);
  }
}

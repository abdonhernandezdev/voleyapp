import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameSession } from './game-session.entity';
import { QuestionsService } from '../questions/questions.service';
import { StartSessionDto, SubmitAnswerDto, CompleteSessionDto } from './dto/game-session.dto';
import { QuestionCategory, QuestionType } from '../questions/question.entity';
import {
  CompleteSessionResponse,
  StartSessionResponse,
  StatsByCategory,
  SubmitAnswerResponse,
  UserSessionsStatsResponse,
} from './game-sessions.types';
import { SCORING } from './scoring.constants';
import { AchievementsService } from '../achievements/achievements.service';
import { ScoringService } from '../scoring/scoring.service';
import { ScoringGame } from '../scoring/scoring.constants';

@Injectable()
export class GameSessionsService {
  constructor(
    @InjectRepository(GameSession)
    private readonly sessionRepo: Repository<GameSession>,
    private readonly questionsService: QuestionsService,
    private readonly achievementsService: AchievementsService,
    private readonly scoringService: ScoringService,
  ) {}

  async startSession(userId: string, dto: StartSessionDto): Promise<StartSessionResponse> {
    // Evita sesiones simultaneas abiertas para el mismo usuario.
    const openSession = await this.sessionRepo.findOne({
      where: { userId, completed: false },
      order: { createdAt: 'DESC' },
    });
    if (openSession) {
      const ageMs = Date.now() - new Date(openSession.createdAt).getTime();
      const maxOpenSessionAgeMs = 2 * 60 * 60 * 1000;
      if (ageMs < maxOpenSessionAgeMs) {
        throw new BadRequestException('Ya existe una sesion abierta. Completa o descarta la sesion actual.');
      }
      openSession.completed = true;
      await this.sessionRepo.save(openSession);
    }

    // Solo preguntas tipo quiz para este flujo de sesion.
    const questions = await this.questionsService.getRandomQuestions(
      dto.category,
      10,
      QuestionType.QUIZ,
    );
    if (questions.length === 0) {
      throw new BadRequestException('No hay preguntas disponibles para la categoria solicitada.');
    }

    const session = this.sessionRepo.create({
      userId,
      mode: dto.mode,
      category: dto.category,
      totalQuestions: questions.length,
      questionIds: questions.map((q) => q.id),
      answers: [],
    });
    const saved = await this.sessionRepo.save(session);

    return { session: saved, questions: this.questionsService.toPublicQuestions(questions) };
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    dto: SubmitAnswerDto,
  ): Promise<SubmitAnswerResponse> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Sesion no encontrada');
    if (session.completed) throw new BadRequestException('La sesion ya fue completada');
    if (!session.questionIds?.includes(dto.questionId)) {
      throw new BadRequestException('La pregunta no pertenece a esta sesion');
    }
    if (session.answers.some((answer) => answer.questionId === dto.questionId)) {
      throw new BadRequestException('La pregunta ya fue respondida en esta sesion');
    }

    const question = await this.questionsService.findById(dto.questionId);
    if (!question || !question.isActive || question.type !== QuestionType.QUIZ) {
      throw new BadRequestException('Pregunta no valida para esta sesion');
    }
    if (!question.options || question.correctOptionIndex === null || question.correctOptionIndex === undefined) {
      throw new BadRequestException('La pregunta no tiene configuracion de quiz valida');
    }

    const selectedOptionIndex = dto.answer.selectedOptionIndex;
    const hasSelection = selectedOptionIndex >= 0;
    if (hasSelection && selectedOptionIndex >= question.options.length) {
      throw new BadRequestException('Indice de opcion invalido para la pregunta');
    }

    const isCorrect = hasSelection && selectedOptionIndex === question.correctOptionIndex;

    let points = 0;
    if (isCorrect) {
      points = SCORING.BASE_POINTS;
      if (dto.answer.timeSeconds <= SCORING.TIME_BONUS_THRESHOLD_SECONDS) {
        points += SCORING.TIME_BONUS;
      }

      // Streak bonus based on consecutive correct in this session
      const consecutiveCorrect = this.getConsecutiveCorrect(session.answers);
      if (consecutiveCorrect > 0 && consecutiveCorrect % 3 === 0) {
        points += SCORING.STREAK_BONUS * Math.floor(consecutiveCorrect / 3);
      }
    }

    session.answers.push({
      questionId: dto.questionId,
      correct: isCorrect,
      selectedOptionIndex,
      timeSeconds: dto.answer.timeSeconds,
      pointsEarned: points,
    });

    session.correctAnswers = session.answers.filter((a) => a.correct).length;
    session.pointsEarned += points;

    await this.sessionRepo.save(session);
    await this.questionsService.recordAnswer(dto.questionId, isCorrect);

    return {
      correct: isCorrect,
      selectedOptionIndex,
      correctOptionIndex: question.correctOptionIndex,
      pointsEarned: points,
      totalPoints: session.pointsEarned,
    };
  }

  async completeSession(
    userId: string,
    sessionId: string,
    dto: CompleteSessionDto,
  ): Promise<CompleteSessionResponse> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Sesion no encontrada');
    if (session.completed) {
      throw new BadRequestException('La sesion ya fue completada');
    }
    if (!session.questionIds || session.questionIds.length === 0) {
      throw new BadRequestException('La sesion no tiene preguntas asignadas');
    }
    if (session.answers.length !== session.questionIds.length) {
      throw new BadRequestException('Debes responder todas las preguntas antes de completar la sesion');
    }

    session.completed = true;
    session.timeSpentSeconds = dto.totalTimeSpentSeconds;
    const scoringResult = await this.scoringService.applyGameScore({
      userId,
      game: ScoringGame.QUIZ,
      rawPoints: session.pointsEarned,
      sessionWon: session.correctAnswers > session.totalQuestions / 2,
      source: 'quiz_session',
      sourceId: session.id,
      metadata: {
        mode: session.mode,
        category: session.category,
      },
    });
    session.pointsEarned = scoringResult.awardedPoints;
    await this.sessionRepo.save(session);

    const unlockedAchievements = await this.achievementsService.evaluateAfterSession(
      scoringResult.updatedUser,
      session,
    );

    return {
      ...session,
      scoring: {
        game: scoringResult.game,
        gameType: scoringResult.gameType,
        rawPoints: scoringResult.rawPoints,
        normalizedPoints: scoringResult.normalizedPoints,
        awardedPoints: scoringResult.awardedPoints,
        dailyAwardLimit: scoringResult.dailyAwardLimit,
        awardedCountToday: scoringResult.awardedCountToday,
        remainingAwardsToday: scoringResult.remainingAwardsToday,
        dailyCapApplied: scoringResult.dailyCapApplied,
      },
      unlockedAchievements,
    };
  }

  async getUserSessions(userId: string, limit = 10): Promise<GameSession[]> {
    return this.sessionRepo.find({
      where: { userId, completed: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUserStats(userId: string): Promise<UserSessionsStatsResponse> {
    // Una sola query con GROUP BY en lugar de cargar todas las sesiones en memoria
    const rows: Array<{
      category: QuestionCategory;
      sessions: string;
      totalPoints: string;
      correct: string;
      totalQuestions: string;
    }> = await this.sessionRepo
      .createQueryBuilder('s')
      .select('s.category', 'category')
      .addSelect('COUNT(*)', 'sessions')
      .addSelect('SUM(s.pointsEarned)', 'totalPoints')
      .addSelect('SUM(s.correctAnswers)', 'correct')
      .addSelect('SUM(s.totalQuestions)', 'totalQuestions')
      .where('s.userId = :userId AND s.completed = true', { userId })
      .groupBy('s.category')
      .getRawMany();

    const totalsRow = await this.sessionRepo
      .createQueryBuilder('s')
      .select('COUNT(*)', 'totalSessions')
      .addSelect('SUM(s.pointsEarned)', 'totalPoints')
      .addSelect('SUM(s.correctAnswers)', 'correct')
      .addSelect('SUM(s.totalQuestions)', 'totalQuestions')
      .where('s.userId = :userId AND s.completed = true', { userId })
      .getRawOne();

    const byCategory = {} as StatsByCategory;
    const categories = Object.values(QuestionCategory) as QuestionCategory[];
    for (const cat of categories) {
      const row = rows.find((r) => r.category === cat);
      const sessions = row ? Number(row.sessions) : 0;
      const correct = row ? Number(row.correct) : 0;
      const totalQ = row ? Number(row.totalQuestions) : 0;
      byCategory[cat] = {
        sessions,
        totalPoints: row ? Number(row.totalPoints) : 0,
        accuracy: sessions && totalQ ? Math.round((correct / totalQ) * 100) : 0,
      };
    }

    const totalSessions = Number(totalsRow?.totalSessions ?? 0);
    const totalCorrect = Number(totalsRow?.correct ?? 0);
    const totalQ = Number(totalsRow?.totalQuestions ?? 0);

    return {
      totalSessions,
      totalPoints: Number(totalsRow?.totalPoints ?? 0),
      overallAccuracy: totalSessions && totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0,
      byCategory,
    };
  }

  private getConsecutiveCorrect(answers: GameSession['answers']): number {
    let count = 0;
    for (let i = answers.length - 1; i >= 0; i--) {
      if (answers[i].correct) count++;
      else break;
    }
    return count;
  }
}

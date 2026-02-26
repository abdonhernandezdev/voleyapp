import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GameSessionsService } from './game-sessions.service';
import { GameSession, GameMode } from './game-session.entity';
import { QuestionsService } from '../questions/questions.service';
import { QuestionType, QuestionCategory, Difficulty } from '../questions/question.entity';
import { AchievementsService } from '../achievements/achievements.service';
import { ScoringService } from '../scoring/scoring.service';
import { ScoringGame, ScoringGameType } from '../scoring/scoring.constants';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeQuestion(id: string, correctIndex = 0) {
  return {
    id,
    type: QuestionType.QUIZ,
    category: QuestionCategory.BASIC_RULES,
    difficulty: Difficulty.EASY,
    question: '¿Pregunta de prueba?',
    options: ['A', 'B', 'C', 'D'],
    correctOptionIndex: correctIndex,
    explanation: null,
    fieldConfig: null,
    rotationConfig: null,
    timesAnswered: 0,
    timesCorrect: 0,
    isActive: true,
    createdAt: new Date(),
  };
}

function makeSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    id: 'session-uuid-1',
    userId: 'user-uuid-1',
    mode: GameMode.QUICK,
    category: undefined as any,
    totalQuestions: 1,
    correctAnswers: 0,
    pointsEarned: 0,
    timeSpentSeconds: 0,
    questionIds: ['q-uuid-1'],
    answers: [],
    completed: false,
    createdAt: new Date(),
    user: undefined as any,
    ...overrides,
  } as GameSession;
}

// ─── QueryBuilder mock for getUserStats ─────────────────────────────────────

function makeQueryBuilder() {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue({ totalSessions: '0', totalPoints: '0', correct: '0', totalQuestions: '0' }),
    getMany: jest.fn().mockResolvedValue([]),
  };
  return qb;
}

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('GameSessionsService', () => {
  let service: GameSessionsService;
  let sessionRepo: any;
  let questionsService: jest.Mocked<QuestionsService>;
  let scoringService: jest.Mocked<ScoringService>;
  let achievementsService: jest.Mocked<AchievementsService>;

  beforeEach(async () => {
    sessionRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(makeQueryBuilder()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameSessionsService,
        { provide: getRepositoryToken(GameSession), useValue: sessionRepo },
        {
          provide: QuestionsService,
          useValue: {
            getRandomQuestions: jest.fn(),
            findById: jest.fn(),
            recordAnswer: jest.fn().mockResolvedValue(undefined),
            toPublicQuestions: jest.fn((qs) => qs),
          },
        },
        {
          provide: ScoringService,
          useValue: {
            applyGameScore: jest.fn().mockResolvedValue({
              game: ScoringGame.QUIZ,
              gameType: ScoringGameType.GENERAL,
              rawPoints: 100,
              normalizedPoints: 100,
              awardedPoints: 100,
              dailyAwardLimit: 2,
              awardedCountToday: 1,
              remainingAwardsToday: 1,
              dailyCapApplied: false,
              updatedUser: {
                id: 'user-uuid-1',
                role: 'player',
                totalPoints: 100,
                gamesPlayed: 1,
                sessionsWon: 1,
                streak: 1,
                maxStreak: 1,
              } as any,
            }),
          },
        },
        {
          provide: AchievementsService,
          useValue: {
            evaluateAfterSession: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<GameSessionsService>(GameSessionsService);
    questionsService = module.get(QuestionsService);
    scoringService = module.get(ScoringService);
    achievementsService = module.get(AchievementsService);
  });

  // ─── startSession ──────────────────────────────────────────────────────

  describe('startSession', () => {
    it('should create and return a new session with questions', async () => {
      const q = makeQuestion('q-uuid-1');
      sessionRepo.findOne.mockResolvedValue(null);
      questionsService.getRandomQuestions.mockResolvedValue([q] as any);
      const session = makeSession({ questionIds: [q.id] });
      sessionRepo.create.mockReturnValue(session);
      sessionRepo.save.mockResolvedValue(session);

      const result = await service.startSession('user-uuid-1', { mode: GameMode.QUICK });

      expect(result.session).toBeDefined();
      expect(result.questions).toHaveLength(1);
    });

    it('should throw BadRequestException if an open session exists (< 2h)', async () => {
      const openSession = makeSession({ completed: false, createdAt: new Date() });
      sessionRepo.findOne.mockResolvedValue(openSession);

      await expect(
        service.startSession('user-uuid-1', { mode: GameMode.QUICK }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should discard a stale open session (> 2h) and create a new one', async () => {
      const staleDate = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3h ago
      const staleSession = makeSession({ completed: false, createdAt: staleDate });
      sessionRepo.findOne.mockResolvedValue(staleSession);
      sessionRepo.save
        .mockResolvedValueOnce({ ...staleSession, completed: true })  // discard
        .mockResolvedValueOnce(makeSession());                         // new session
      questionsService.getRandomQuestions.mockResolvedValue([makeQuestion('q-uuid-1')] as any);
      sessionRepo.create.mockReturnValue(makeSession());

      const result = await service.startSession('user-uuid-1', { mode: GameMode.QUICK });

      expect(sessionRepo.save).toHaveBeenCalledTimes(2);
      expect(result.session).toBeDefined();
    });

    it('should throw BadRequestException if no questions are available', async () => {
      sessionRepo.findOne.mockResolvedValue(null);
      questionsService.getRandomQuestions.mockResolvedValue([]);

      await expect(
        service.startSession('user-uuid-1', { mode: GameMode.QUICK }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── submitAnswer ──────────────────────────────────────────────────────

  describe('submitAnswer', () => {
    it('should return correct=true and award base points for a correct answer', async () => {
      const q = makeQuestion('q-uuid-1', 0);
      const session = makeSession({ questionIds: ['q-uuid-1'], answers: [] });
      sessionRepo.findOne.mockResolvedValue(session);
      sessionRepo.save.mockResolvedValue(session);
      questionsService.findById.mockResolvedValue(q as any);

      const result = await service.submitAnswer('user-uuid-1', 'session-uuid-1', {
        questionId: 'q-uuid-1',
        answer: { selectedOptionIndex: 0, timeSeconds: 15 }, // no time bonus
      });

      expect(result.correct).toBe(true);
      expect(result.pointsEarned).toBe(100); // BASE_POINTS only
    });

    it('should add TIME_BONUS when answered within threshold', async () => {
      const q = makeQuestion('q-uuid-1', 1);
      const session = makeSession({ questionIds: ['q-uuid-1'], answers: [] });
      sessionRepo.findOne.mockResolvedValue(session);
      sessionRepo.save.mockResolvedValue(session);
      questionsService.findById.mockResolvedValue(q as any);

      const result = await service.submitAnswer('user-uuid-1', 'session-uuid-1', {
        questionId: 'q-uuid-1',
        answer: { selectedOptionIndex: 1, timeSeconds: 5 }, // within 10s threshold
      });

      expect(result.correct).toBe(true);
      expect(result.pointsEarned).toBe(150); // 100 + 50 time bonus
    });

    it('should add STREAK_BONUS after 3 consecutive correct answers', async () => {
      const q = makeQuestion('q-uuid-4', 2);
      const prevAnswers = [
        { questionId: 'q-uuid-1', correct: true, selectedOptionIndex: 0, timeSeconds: 5, pointsEarned: 100 },
        { questionId: 'q-uuid-2', correct: true, selectedOptionIndex: 0, timeSeconds: 5, pointsEarned: 100 },
        { questionId: 'q-uuid-3', correct: true, selectedOptionIndex: 0, timeSeconds: 5, pointsEarned: 100 },
      ];
      const session = makeSession({
        questionIds: ['q-uuid-1', 'q-uuid-2', 'q-uuid-3', 'q-uuid-4'],
        answers: prevAnswers,
        pointsEarned: 300,
        correctAnswers: 3,
      });
      sessionRepo.findOne.mockResolvedValue(session);
      sessionRepo.save.mockResolvedValue(session);
      questionsService.findById.mockResolvedValue(q as any);

      const result = await service.submitAnswer('user-uuid-1', 'session-uuid-1', {
        questionId: 'q-uuid-4',
        answer: { selectedOptionIndex: 2, timeSeconds: 20 },
      });

      // 100 base + 20 streak bonus (3 consecutive)
      expect(result.correct).toBe(true);
      expect(result.pointsEarned).toBe(120);
    });

    it('should return 0 points for incorrect answer', async () => {
      const q = makeQuestion('q-uuid-1', 0);
      const session = makeSession({ questionIds: ['q-uuid-1'], answers: [] });
      sessionRepo.findOne.mockResolvedValue(session);
      sessionRepo.save.mockResolvedValue(session);
      questionsService.findById.mockResolvedValue(q as any);

      const result = await service.submitAnswer('user-uuid-1', 'session-uuid-1', {
        questionId: 'q-uuid-1',
        answer: { selectedOptionIndex: 2, timeSeconds: 5 }, // wrong index
      });

      expect(result.correct).toBe(false);
      expect(result.pointsEarned).toBe(0);
    });

    it('should throw NotFoundException if session is not found', async () => {
      sessionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.submitAnswer('user-uuid-1', 'bad-session-id', {
          questionId: 'q-uuid-1',
          answer: { selectedOptionIndex: 0, timeSeconds: 5 },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if question was already answered', async () => {
      const q = makeQuestion('q-uuid-1', 0);
      const session = makeSession({
        questionIds: ['q-uuid-1'],
        answers: [{ questionId: 'q-uuid-1', correct: true, selectedOptionIndex: 0, timeSeconds: 5, pointsEarned: 100 }],
      });
      sessionRepo.findOne.mockResolvedValue(session);
      questionsService.findById.mockResolvedValue(q as any);

      await expect(
        service.submitAnswer('user-uuid-1', 'session-uuid-1', {
          questionId: 'q-uuid-1',
          answer: { selectedOptionIndex: 0, timeSeconds: 5 },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── completeSession ───────────────────────────────────────────────────

  describe('completeSession', () => {
    it('should mark session as completed and apply scoring policy', async () => {
      const session = makeSession({
        questionIds: ['q-uuid-1'],
        answers: [{ questionId: 'q-uuid-1', correct: true, selectedOptionIndex: 0, timeSeconds: 5, pointsEarned: 100 }],
        correctAnswers: 1,
        totalQuestions: 1,
        pointsEarned: 100,
      });
      sessionRepo.findOne.mockResolvedValue(session);
      sessionRepo.save.mockResolvedValue({ ...session, completed: true });

      const result = await service.completeSession('user-uuid-1', 'session-uuid-1', {
        totalTimeSpentSeconds: 60,
      });

      expect(result.completed).toBe(true);
      expect(scoringService.applyGameScore).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          game: ScoringGame.QUIZ,
          rawPoints: 100,
        }),
      );
      expect(achievementsService.evaluateAfterSession).toHaveBeenCalled();
    });

    it('should throw BadRequestException if not all questions are answered', async () => {
      const session = makeSession({
        questionIds: ['q-uuid-1', 'q-uuid-2'],
        answers: [{ questionId: 'q-uuid-1', correct: true, selectedOptionIndex: 0, timeSeconds: 5, pointsEarned: 100 }],
      });
      sessionRepo.findOne.mockResolvedValue(session);

      await expect(
        service.completeSession('user-uuid-1', 'session-uuid-1', { totalTimeSpentSeconds: 30 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if session does not exist', async () => {
      sessionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.completeSession('user-uuid-1', 'bad-session', { totalTimeSpentSeconds: 30 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

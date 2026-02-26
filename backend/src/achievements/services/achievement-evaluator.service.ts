import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ACHIEVEMENT_CATALOG, ACHIEVEMENT_CODES } from '../achievement.constants';
import { UserAchievement } from '../entities/user-achievement.entity';
import { SessionContext, UnlockedAchievementPayload } from '../achievements.types';
import { User, UserRole } from '../../users/user.entity';
import { GameSession } from '../../game-sessions/game-session.entity';
import { ScoringGame } from '../../scoring/scoring.constants';
import { ScoreEvent } from '../../scoring/score-event.entity';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AchievementEvaluatorService {
  constructor(
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepo: Repository<GameSession>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ScoreEvent)
    private readonly scoreEventRepo: Repository<ScoreEvent>,
    private readonly usersService: UsersService,
  ) {}

  async evaluateAfterSession(
    updatedUser: User,
    session: GameSession,
  ): Promise<UnlockedAchievementPayload[]> {
    const context: SessionContext = {
      sessionCategory: session.category ?? null,
      sessionPoints: session.pointsEarned,
      sessionPerfect: session.correctAnswers === session.totalQuestions && session.totalQuestions > 0,
    };

    const candidates = new Set<string>();
    if (updatedUser.gamesPlayed >= 1) candidates.add('first_session_completed');
    if (updatedUser.streak >= 3) candidates.add('streak_3_days');
    if (updatedUser.streak >= 7) candidates.add('streak_7_days');
    if (updatedUser.streak >= 14) candidates.add('streak_14_days');
    if (updatedUser.streak >= 30) candidates.add('streak_30_days');
    if (context.sessionPerfect) candidates.add('perfect_session');
    if (updatedUser.totalPoints >= 5000) candidates.add('top_scorer');
    if (updatedUser.totalPoints >= 15000) candidates.add('champion');

    const quizSessions = await this.countQuizSessions(updatedUser.id);
    if (quizSessions >= 10) candidates.add('quiz_veteran');
    if (quizSessions >= 50) candidates.add('quiz_master');

    if (context.sessionCategory && (await this.hasCategoryPerfectAccuracy(updatedUser.id, context.sessionCategory))) {
      candidates.add('category_master');
    }

    if (updatedUser.role === UserRole.PLAYER && (await this.didImproveRanking(updatedUser, context.sessionPoints))) {
      candidates.add('rank_climber');
    }

    return this.unlockAchievements(updatedUser.id, [...candidates]);
  }

  async evaluateAfterTraining(
    updatedUser: User,
    game: ScoringGame,
  ): Promise<UnlockedAchievementPayload[]> {
    const candidates = new Set<string>();

    if (updatedUser.streak >= 3) candidates.add('streak_3_days');
    if (updatedUser.streak >= 7) candidates.add('streak_7_days');
    if (updatedUser.streak >= 14) candidates.add('streak_14_days');
    if (updatedUser.streak >= 30) candidates.add('streak_30_days');
    if (updatedUser.totalPoints >= 5000) candidates.add('top_scorer');
    if (updatedUser.totalPoints >= 15000) candidates.add('champion');

    const trainingGames: ScoringGame[] = [
      ScoringGame.DEFENSE_ZONE,
      ScoringGame.RECEPTION_5_1,
      ScoringGame.RECEPTION_4_2,
      ScoringGame.RECEPTION_6_2,
      ScoringGame.ROLE_RECEPTION,
      ScoringGame.ROLE_DEFENSE,
    ];
    const trainingCount = await this.countScoreEvents(updatedUser.id, trainingGames);
    if (trainingCount >= 5) candidates.add('training_fan');
    if (trainingCount >= 20) candidates.add('training_addict');

    if (game === ScoringGame.RECEPTION_4_2 || game === ScoringGame.RECEPTION_6_2) {
      candidates.add('formation_explorer');
    }

    const has51 = await this.hasPlayedGame(updatedUser.id, ScoringGame.RECEPTION_5_1);
    const has42 = await this.hasPlayedGame(updatedUser.id, ScoringGame.RECEPTION_4_2);
    const has62 = await this.hasPlayedGame(updatedUser.id, ScoringGame.RECEPTION_6_2);
    if (has51 && has42 && has62) candidates.add('all_formations');

    return this.unlockAchievements(updatedUser.id, [...candidates]);
  }

  async unlockAchievements(
    userId: string,
    candidateCodes: string[],
  ): Promise<UnlockedAchievementPayload[]> {
    const validCodes = candidateCodes.filter((code) => ACHIEVEMENT_CODES.has(code));
    if (validCodes.length === 0) return [];

    const uniqueCodes = [...new Set(validCodes)];
    const existing = await this.userAchievementRepo.find({
      where: { userId, code: In(uniqueCodes) },
      select: ['code'],
    });
    const existingCodes = new Set(existing.map((entry) => entry.code));
    const newCodes = uniqueCodes.filter((code) => !existingCodes.has(code));
    if (newCodes.length === 0) return [];

    const created: UserAchievement[] = [];
    for (const code of newCodes) {
      try {
        const saved = await this.userAchievementRepo.save(
          this.userAchievementRepo.create({
            id: randomUUID(),
            userId,
            code,
          }),
        );
        created.push(saved);
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          continue;
        }
        throw error;
      }
    }

    const catalogByCode = new Map(ACHIEVEMENT_CATALOG.map((achievement) => [achievement.code, achievement]));
    const unlockedPayload = created
      .map((entry) => {
        const meta = catalogByCode.get(entry.code);
        if (!meta) return null;
        return {
          ...meta,
          unlockedAt: entry.unlockedAt.toISOString(),
        };
      })
      .filter((entry): entry is UnlockedAchievementPayload => entry !== null);

    const rewardPoints = unlockedPayload.reduce((sum, achievement) => sum + achievement.rewardPoints, 0);
    if (rewardPoints > 0) {
      await this.usersService.refundPoints(userId, rewardPoints);
    }

    return unlockedPayload;
  }

  private async countQuizSessions(userId: string): Promise<number> {
    return this.gameSessionRepo
      .createQueryBuilder('s')
      .where('s."userId" = :userId', { userId })
      .andWhere('s.completed = true')
      .getCount();
  }

  private async countScoreEvents(userId: string, games: ScoringGame[]): Promise<number> {
    return this.scoreEventRepo
      .createQueryBuilder('e')
      .where('e."userId" = :userId', { userId })
      .andWhere('e.game IN (:...games)', { games })
      .getCount();
  }

  private async hasPlayedGame(userId: string, game: ScoringGame): Promise<boolean> {
    const count = await this.scoreEventRepo
      .createQueryBuilder('e')
      .where('e."userId" = :userId', { userId })
      .andWhere('e.game = :game', { game })
      .getCount();
    return count > 0;
  }

  private async hasCategoryPerfectAccuracy(userId: string, category: GameSession['category']): Promise<boolean> {
    if (!category) return false;

    const aggregates = await this.gameSessionRepo
      .createQueryBuilder('s')
      .select('SUM(s."correctAnswers")', 'correct')
      .addSelect('SUM(s."totalQuestions")', 'total')
      .where('s."userId" = :userId', { userId })
      .andWhere('s.completed = true')
      .andWhere('s.category = :category', { category })
      .getRawOne<{ correct: string; total: string }>();

    const correct = Number(aggregates?.correct ?? 0);
    const total = Number(aggregates?.total ?? 0);
    if (total < 10) return false;
    return total > 0 && correct === total;
  }

  private async didImproveRanking(updatedUser: User, pointsEarnedInSession: number): Promise<boolean> {
    if (pointsEarnedInSession <= 0) return false;

    const previousPoints = Math.max(updatedUser.totalPoints - pointsEarnedInSession, 0);

    const before = await this.userRepo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: UserRole.PLAYER })
      .andWhere('u.totalPoints > :points', { points: previousPoints })
      .getCount();

    const now = await this.userRepo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: UserRole.PLAYER })
      .andWhere('u.totalPoints > :points', { points: updatedUser.totalPoints })
      .getCount();

    return (now + 1) < (before + 1);
  }

  private isUniqueViolation(error: unknown): boolean {
    if (error instanceof QueryFailedError) {
      const driverError = (error as QueryFailedError & { driverError?: { code?: string } }).driverError;
      return driverError?.code === '23505';
    }
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code?: string }).code;
      return code === '23505';
    }
    return false;
  }
}

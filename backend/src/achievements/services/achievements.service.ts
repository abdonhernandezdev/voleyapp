import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ACHIEVEMENT_CATALOG,
  AchievementDefinition,
} from '../achievement.constants';
import { UserAchievement } from '../entities/user-achievement.entity';
import {
  AchievementProgress,
  AchievementProgressInfo,
  CategoryAggregateRaw,
} from '../achievements.types';
import { User, UserRole } from '../../users/user.entity';
import { GameSession } from '../../game-sessions/game-session.entity';
import { ScoringGame } from '../../scoring/scoring.constants';
import { ScoreEvent } from '../../scoring/score-event.entity';
import { AchievementEvaluatorService } from './achievement-evaluator.service';
import { UnlockedAchievementPayload } from '../achievements.types';

interface AchievementProgressSnapshot {
  totalPoints: number;
  gamesPlayed: number;
  streak: number;
  quizSessions: number;
  perfectSessions: number;
  trainingGamesPlayed: number;
  bestCategoryAccuracy: number;
  bestCategoryAnswered: number;
  formationCoreCount: number;
  formationAlternativeCount: number;
  rankPosition: number | null;
  playersCount: number;
}

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepo: Repository<GameSession>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ScoreEvent)
    private readonly scoreEventRepo: Repository<ScoreEvent>,
    private readonly evaluator: AchievementEvaluatorService,
  ) {}

  getCatalog(): AchievementDefinition[] {
    return ACHIEVEMENT_CATALOG;
  }

  async getUserProgress(userId: string): Promise<AchievementProgress[]> {
    const [unlocked, snapshot] = await Promise.all([
      this.userAchievementRepo.find({
        where: { userId },
        order: { unlockedAt: 'DESC' },
      }),
      this.buildProgressSnapshot(userId),
    ]);
    const unlockedByCode = new Map(unlocked.map((entry) => [entry.code, entry.unlockedAt]));

    if (snapshot) {
      const retroactiveCandidates = this.getRetroactiveCandidateCodes(snapshot);
      if (retroactiveCandidates.length > 0) {
        const retroUnlocked = await this.evaluator.unlockAchievements(userId, retroactiveCandidates);
        for (const achievement of retroUnlocked) {
          unlockedByCode.set(achievement.code, new Date(achievement.unlockedAt));
        }
      }
    }

    return ACHIEVEMENT_CATALOG.map((achievement) => {
      const unlockedAt = unlockedByCode.get(achievement.code);
      const unlockedState = Boolean(unlockedAt);
      const rawProgress = snapshot
        ? this.buildProgressByCode(achievement.code, snapshot, unlockedState)
        : null;
      const progress =
        rawProgress && unlockedState
          ? {
              ...rawProgress,
              current: rawProgress.target,
              percent: 100,
              text: 'Completado',
            }
          : rawProgress;
      return {
        ...achievement,
        unlocked: unlockedState,
        unlockedAt: unlockedAt ? unlockedAt.toISOString() : null,
        progress,
      };
    });
  }

  async evaluateAfterSession(
    updatedUser: User,
    session: GameSession,
  ): Promise<UnlockedAchievementPayload[]> {
    return this.evaluator.evaluateAfterSession(updatedUser, session);
  }

  async evaluateAfterTraining(
    updatedUser: User,
    game: ScoringGame,
  ): Promise<UnlockedAchievementPayload[]> {
    return this.evaluator.evaluateAfterTraining(updatedUser, game);
  }

  private async buildProgressSnapshot(userId: string): Promise<AchievementProgressSnapshot | null> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'role', 'totalPoints', 'gamesPlayed', 'streak'],
    });
    if (!user) {
      return null;
    }

    const trainingGames: ScoringGame[] = [
      ScoringGame.DEFENSE_ZONE,
      ScoringGame.RECEPTION_5_1,
      ScoringGame.RECEPTION_4_2,
      ScoringGame.RECEPTION_6_2,
      ScoringGame.ROLE_RECEPTION,
      ScoringGame.ROLE_DEFENSE,
    ];

    const [
      quizSessions,
      perfectSessions,
      trainingGamesPlayed,
      bestCategoryMetrics,
      formationMetrics,
      rankingMetrics,
    ] = await Promise.all([
      this.countQuizSessions(userId),
      this.countPerfectSessions(userId),
      this.countScoreEvents(userId, trainingGames),
      this.getBestCategoryMetrics(userId),
      this.getFormationMetrics(userId),
      this.getRankingMetrics(user),
    ]);

    return {
      totalPoints: user.totalPoints,
      gamesPlayed: user.gamesPlayed,
      streak: user.streak,
      quizSessions,
      perfectSessions,
      trainingGamesPlayed,
      bestCategoryAccuracy: bestCategoryMetrics.bestAccuracy,
      bestCategoryAnswered: bestCategoryMetrics.bestAnswered,
      formationCoreCount: formationMetrics.coreCount,
      formationAlternativeCount: formationMetrics.alternativeCount,
      rankPosition: rankingMetrics.rankPosition,
      playersCount: rankingMetrics.playersCount,
    };
  }

  private getRetroactiveCandidateCodes(snapshot: AchievementProgressSnapshot): string[] {
    const candidates = new Set<string>();
    if (snapshot.gamesPlayed >= 1) candidates.add('first_session_completed');
    if (snapshot.streak >= 3) candidates.add('streak_3_days');
    if (snapshot.streak >= 7) candidates.add('streak_7_days');
    if (snapshot.streak >= 14) candidates.add('streak_14_days');
    if (snapshot.streak >= 30) candidates.add('streak_30_days');
    if (snapshot.perfectSessions >= 1) candidates.add('perfect_session');
    if (snapshot.bestCategoryAnswered >= 10 && snapshot.bestCategoryAccuracy >= 100) {
      candidates.add('category_master');
    }
    if (snapshot.quizSessions >= 10) candidates.add('quiz_veteran');
    if (snapshot.quizSessions >= 50) candidates.add('quiz_master');
    if (snapshot.trainingGamesPlayed >= 5) candidates.add('training_fan');
    if (snapshot.trainingGamesPlayed >= 20) candidates.add('training_addict');
    if (snapshot.formationAlternativeCount >= 1) candidates.add('formation_explorer');
    if (snapshot.formationCoreCount >= 3) candidates.add('all_formations');
    if (snapshot.totalPoints >= 5000) candidates.add('top_scorer');
    if (snapshot.totalPoints >= 15000) candidates.add('champion');
    return [...candidates];
  }

  private buildProgressByCode(
    code: string,
    snapshot: AchievementProgressSnapshot,
    unlocked: boolean,
  ): AchievementProgressInfo | null {
    switch (code) {
      case 'first_session_completed':
        return this.toProgress(snapshot.gamesPlayed, 1, `${Math.min(snapshot.gamesPlayed, 1)}/1 sesiones completadas`);
      case 'streak_3_days':
        return this.toProgress(snapshot.streak, 3, `${Math.min(snapshot.streak, 3)}/3 dias de racha`);
      case 'streak_7_days':
        return this.toProgress(snapshot.streak, 7, `${Math.min(snapshot.streak, 7)}/7 dias de racha`);
      case 'streak_14_days':
        return this.toProgress(snapshot.streak, 14, `${Math.min(snapshot.streak, 14)}/14 dias de racha`);
      case 'streak_30_days':
        return this.toProgress(snapshot.streak, 30, `${Math.min(snapshot.streak, 30)}/30 dias de racha`);
      case 'perfect_session':
        return this.toProgress(snapshot.perfectSessions, 1, `${Math.min(snapshot.perfectSessions, 1)}/1 sesiones perfectas`);
      case 'category_master':
        if (snapshot.bestCategoryAnswered < 10) {
          return this.toProgress(snapshot.bestCategoryAnswered, 10, `${Math.min(snapshot.bestCategoryAnswered, 10)}/10 respuestas minimas en una categoria`);
        }
        return this.toProgress(snapshot.bestCategoryAccuracy, 100, `${Math.min(snapshot.bestCategoryAccuracy, 100)}% precision en tu mejor categoria`);
      case 'rank_climber':
        if (unlocked) return this.toProgress(1, 1, 'Completado');
        if (snapshot.rankPosition !== null && snapshot.playersCount > 0) {
          return this.toProgress(0, 1, `Posicion actual #${snapshot.rankPosition} de ${snapshot.playersCount}. Sube 1 puesto para desbloquearlo.`);
        }
        return this.toProgress(0, 1, 'Completa sesiones y supera a otro jugador en ranking.');
      case 'quiz_veteran':
        return this.toProgress(snapshot.quizSessions, 10, `${Math.min(snapshot.quizSessions, 10)}/10 sesiones de quiz`);
      case 'quiz_master':
        return this.toProgress(snapshot.quizSessions, 50, `${Math.min(snapshot.quizSessions, 50)}/50 sesiones de quiz`);
      case 'training_fan':
        return this.toProgress(snapshot.trainingGamesPlayed, 5, `${Math.min(snapshot.trainingGamesPlayed, 5)}/5 minijuegos de entrenamiento`);
      case 'training_addict':
        return this.toProgress(snapshot.trainingGamesPlayed, 20, `${Math.min(snapshot.trainingGamesPlayed, 20)}/20 minijuegos de entrenamiento`);
      case 'formation_explorer':
        return this.toProgress(snapshot.formationAlternativeCount, 1, `${Math.min(snapshot.formationAlternativeCount, 1)}/1 sistemas alternativos jugados (4-2 o 6-2)`);
      case 'all_formations':
        return this.toProgress(snapshot.formationCoreCount, 3, `${Math.min(snapshot.formationCoreCount, 3)}/3 sistemas de recepcion jugados`);
      case 'top_scorer':
        return this.toProgress(snapshot.totalPoints, 5000, `${this.formatNumber(snapshot.totalPoints)} / 5.000 puntos`);
      case 'champion':
        return this.toProgress(snapshot.totalPoints, 15000, `${this.formatNumber(snapshot.totalPoints)} / 15.000 puntos`);
      default:
        return null;
    }
  }

  private toProgress(current: number, target: number, text: string): AchievementProgressInfo {
    const normalizedCurrent = Math.max(0, Math.min(current, target));
    const percent = target > 0 ? Math.round((normalizedCurrent / target) * 100) : 0;
    return {
      current: normalizedCurrent,
      target,
      percent: Math.max(0, Math.min(percent, 100)),
      text,
    };
  }

  private async countPerfectSessions(userId: string): Promise<number> {
    return this.gameSessionRepo
      .createQueryBuilder('s')
      .where('s."userId" = :userId', { userId })
      .andWhere('s.completed = true')
      .andWhere('s."totalQuestions" > 0')
      .andWhere('s."correctAnswers" = s."totalQuestions"')
      .getCount();
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

  private async getBestCategoryMetrics(
    userId: string,
  ): Promise<{ bestAccuracy: number; bestAnswered: number }> {
    const rows = await this.gameSessionRepo
      .createQueryBuilder('s')
      .select('s.category', 'category')
      .addSelect('SUM(s."correctAnswers")', 'correct')
      .addSelect('SUM(s."totalQuestions")', 'total')
      .where('s."userId" = :userId', { userId })
      .andWhere('s.completed = true')
      .andWhere('s.category IS NOT NULL')
      .groupBy('s.category')
      .getRawMany<{ category: string; correct: string; total: string }>();

    let bestAccuracy = 0;
    let bestAnswered = 0;
    for (const row of rows) {
      const correct = Number(row.correct ?? 0);
      const total = Number(row.total ?? 0);
      if (total <= 0) continue;
      const accuracy = Math.round((correct / total) * 100);
      bestAccuracy = Math.max(bestAccuracy, accuracy);
      bestAnswered = Math.max(bestAnswered, total);
    }

    return { bestAccuracy, bestAnswered };
  }

  private async getFormationMetrics(
    userId: string,
  ): Promise<{ coreCount: number; alternativeCount: number }> {
    const trackedGames: ScoringGame[] = [
      ScoringGame.RECEPTION_5_1,
      ScoringGame.RECEPTION_4_2,
      ScoringGame.RECEPTION_6_2,
    ];
    const rows = await this.scoreEventRepo
      .createQueryBuilder('e')
      .select('e.game', 'game')
      .where('e."userId" = :userId', { userId })
      .andWhere('e.game IN (:...games)', { games: trackedGames })
      .groupBy('e.game')
      .getRawMany<{ game: ScoringGame }>();
    const playedGames = new Set(rows.map((row) => row.game));

    const coreCount = trackedGames.filter((game) => playedGames.has(game)).length;
    const alternativeCount =
      playedGames.has(ScoringGame.RECEPTION_4_2) || playedGames.has(ScoringGame.RECEPTION_6_2)
        ? 1
        : 0;
    return { coreCount, alternativeCount };
  }

  private async getRankingMetrics(
    user: Pick<User, 'id' | 'role' | 'totalPoints'>,
  ): Promise<{ rankPosition: number | null; playersCount: number }> {
    if (user.role !== UserRole.PLAYER) {
      return { rankPosition: null, playersCount: 0 };
    }

    const playersCount = await this.userRepo.count({
      where: { role: UserRole.PLAYER },
    });
    if (playersCount <= 0) {
      return { rankPosition: null, playersCount: 0 };
    }

    const playersAbove = await this.userRepo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: UserRole.PLAYER })
      .andWhere('u.totalPoints > :points', { points: user.totalPoints })
      .getCount();

    return {
      rankPosition: playersAbove + 1,
      playersCount,
    };
  }

  private formatNumber(value: number): string {
    return Math.max(0, Math.round(value)).toLocaleString('es-ES');
  }
}

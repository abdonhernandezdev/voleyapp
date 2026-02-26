import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import {
  GAME_SCORING_POLICY,
  GameScoringPolicy,
  ScoringGame,
  ScoringGameType,
} from './scoring.constants';
import { ScoreEvent } from './score-event.entity';
import {
  ApplyGameScoreInput,
  ApplyGameScoreResult,
  DailyScoringStatusItem,
  DailyScoringStatusResponse,
} from './scoring.types';

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(
    @InjectRepository(ScoreEvent)
    private readonly scoreEventRepo: Repository<ScoreEvent>,
    private readonly usersService: UsersService,
  ) {}

  getPolicy(game: ScoringGame): GameScoringPolicy {
    const policy = GAME_SCORING_POLICY[game];
    if (!policy) {
      throw new BadRequestException('Juego no valido para puntuacion');
    }
    return policy;
  }

  async applyGameScore(input: ApplyGameScoreInput): Promise<ApplyGameScoreResult> {
    const policy = this.getPolicy(input.game);
    const rawPoints = this.normalizeRawPoints(input.rawPoints, policy.maxRawPointsPerRun);
    const normalizedPoints = this.clamp(
      Math.round(rawPoints * policy.baseMultiplier),
      0,
      policy.maxAwardedPerRun,
    );

    const { start, end } = this.getDayRange();
    const awardedCountToday = await this.countAwardedToday(input.userId, input.game, start, end);

    let awardedPoints = normalizedPoints;
    let dailyCapApplied = false;

    if (policy.dailyAwardLimit !== null && normalizedPoints > 0) {
      if (awardedCountToday >= policy.dailyAwardLimit) {
        awardedPoints = 0;
        dailyCapApplied = true;
      } else if (
        awardedCountToday > 0 &&
        typeof policy.secondAwardMultiplier === 'number' &&
        policy.secondAwardMultiplier > 0 &&
        policy.secondAwardMultiplier < 1
      ) {
        awardedPoints = Math.max(1, Math.floor(normalizedPoints * policy.secondAwardMultiplier));
      }
    }

    const effectiveSessionWon =
      typeof input.sessionWon === 'boolean'
        ? input.sessionWon
        : this.resolveSessionWon(rawPoints, policy);

    const nextAwardedCountToday =
      awardedPoints > 0 && !dailyCapApplied ? awardedCountToday + 1 : awardedCountToday;

    await this.scoreEventRepo.save(
      this.scoreEventRepo.create({
        userId: input.userId,
        game: input.game,
        gameType: policy.gameType,
        rawPoints,
        normalizedPoints,
        awardedPoints,
        dailyAwardLimit: policy.dailyAwardLimit,
        awardedCountToday: nextAwardedCountToday,
        dailyCapApplied,
        source: input.source ?? null,
        sourceId: input.sourceId ?? null,
        metadata: input.metadata ?? null,
      }),
    );

    const updatedUser = await this.usersService.addPoints(
      input.userId,
      awardedPoints,
      effectiveSessionWon,
    );

    return {
      game: input.game,
      gameType: policy.gameType,
      rawPoints,
      normalizedPoints,
      awardedPoints,
      dailyAwardLimit: policy.dailyAwardLimit,
      awardedCountToday: nextAwardedCountToday,
      remainingAwardsToday:
        policy.dailyAwardLimit === null
          ? null
          : Math.max(0, policy.dailyAwardLimit - nextAwardedCountToday),
      dailyCapApplied,
      updatedUser,
    };
  }

  async getUserDailyStatus(userId: string): Promise<DailyScoringStatusResponse> {
    const { start, end } = this.getDayRange();
    const rows: Array<{ game: ScoringGame; count: string }> = await this.scoreEventRepo
      .createQueryBuilder('event')
      .select('event.game', 'game')
      .addSelect('COUNT(*)', 'count')
      .where('event.userId = :userId', { userId })
      .andWhere('event.awardedPoints > 0')
      .andWhere('event.createdAt >= :start AND event.createdAt < :end', { start, end })
      .groupBy('event.game')
      .getRawMany();

    const awardedByGame = new Map(rows.map((row) => [row.game, Number(row.count)]));
    const statuses: DailyScoringStatusItem[] = Object.entries(GAME_SCORING_POLICY).map(
      ([game, policy]) => {
        const awardedCountToday = awardedByGame.get(game as ScoringGame) ?? 0;
        const remainingAwardsToday =
          policy.dailyAwardLimit === null
            ? null
            : Math.max(0, policy.dailyAwardLimit - awardedCountToday);
        return {
          game: game as ScoringGame,
          gameType: policy.gameType,
          dailyAwardLimit: policy.dailyAwardLimit,
          awardedCountToday,
          remainingAwardsToday,
          canStillScore: policy.dailyAwardLimit === null || remainingAwardsToday > 0,
        };
      },
    );

    return {
      general: statuses.filter((item) => item.gameType === ScoringGameType.GENERAL),
      individual: statuses.filter((item) => item.gameType === ScoringGameType.INDIVIDUAL),
    };
  }

  private resolveSessionWon(rawPoints: number, policy: GameScoringPolicy): boolean {
    if (typeof policy.winThresholdRawPoints === 'number') {
      return rawPoints >= policy.winThresholdRawPoints;
    }
    return rawPoints > 0;
  }

  private normalizeRawPoints(rawPoints: number, maxRaw: number): number {
    if (!Number.isFinite(rawPoints)) {
      this.logger.warn(`normalizeRawPoints recibió valor no finito: ${rawPoints}`);
      return 0;
    }
    return this.clamp(Math.round(rawPoints), 0, maxRaw);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private getDayRange(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  private async countAwardedToday(
    userId: string,
    game: ScoringGame,
    start: Date,
    end: Date,
  ): Promise<number> {
    return this.scoreEventRepo
      .createQueryBuilder('event')
      .where('event.userId = :userId', { userId })
      .andWhere('event.game = :game', { game })
      .andWhere('event.awardedPoints > 0')
      .andWhere('event.createdAt >= :start AND event.createdAt < :end', { start, end })
      .getCount();
  }
}

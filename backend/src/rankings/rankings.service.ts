import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { PlayerPositionResponse, RankingMode, RankingPlayerEntry } from './rankings.types';
import { ScoreEvent } from '../scoring/score-event.entity';
import { getSpainWeekRange } from '../common/time/spain-week.util';

interface RankingRow {
  id: string;
  username: string;
  displayName: string;
  avatarEmoji: string;
  totalPoints: string;
  gamesPlayed: string;
  sessionsWon: string;
  streak: string;
  maxStreak: string;
  points: string;
}

@Injectable()
export class RankingsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ScoreEvent)
    private readonly scoreEventRepo: Repository<ScoreEvent>,
  ) {}

  async getGlobalRanking(mode: RankingMode = 'weekly'): Promise<RankingPlayerEntry[]> {
    if (mode === 'global') {
      return this.getGlobalPointsRanking();
    }
    return this.getWeeklyPointsRanking();
  }

  async getPlayerPosition(
    userId: string,
    mode: RankingMode = 'weekly',
  ): Promise<PlayerPositionResponse> {
    const ranking = await this.getGlobalRanking(mode);
    const positionIndex = ranking.findIndex((player) => player.id === userId);
    const position = positionIndex >= 0 ? positionIndex + 1 : 0;
    const total = ranking.length;
    const player = position > 0 ? ranking[position - 1] : undefined;

    const surrounding =
      position > 0
        ? ranking.slice(Math.max(0, position - 3), Math.min(total, position + 2))
        : ranking.slice(0, 5);

    return {
      position,
      total,
      player,
      surrounding,
    };
  }

  private async getWeeklyPointsRanking(): Promise<RankingPlayerEntry[]> {
    const { start, end } = getSpainWeekRange();
    const rows = await this.userRepo
      .createQueryBuilder('u')
      .leftJoin(
        ScoreEvent,
        'e',
        'e."userId" = u.id AND e."createdAt" >= :start AND e."createdAt" < :end',
        { start, end },
      )
      .select('u.id', 'id')
      .addSelect('u.username', 'username')
      .addSelect('u."displayName"', 'displayName')
      .addSelect('u."avatarEmoji"', 'avatarEmoji')
      .addSelect('u."totalPoints"', 'totalPoints')
      .addSelect('u."gamesPlayed"', 'gamesPlayed')
      .addSelect('u."sessionsWon"', 'sessionsWon')
      .addSelect('u.streak', 'streak')
      .addSelect('u."maxStreak"', 'maxStreak')
      .addSelect('COALESCE(SUM(e."awardedPoints"), 0)', 'points')
      .where('u.role = :role', { role: UserRole.PLAYER })
      .groupBy('u.id')
      .addGroupBy('u.username')
      .addGroupBy('u."displayName"')
      .addGroupBy('u."avatarEmoji"')
      .addGroupBy('u."totalPoints"')
      .addGroupBy('u."gamesPlayed"')
      .addGroupBy('u."sessionsWon"')
      .addGroupBy('u.streak')
      .addGroupBy('u."maxStreak"')
      .orderBy('points', 'DESC')
      .addOrderBy('u."totalPoints"', 'DESC')
      .addOrderBy('u.username', 'ASC')
      .getRawMany<RankingRow>();

    return this.mapRowsToRanking(rows);
  }

  private async getGlobalPointsRanking(): Promise<RankingPlayerEntry[]> {
    const rows = await this.userRepo
      .createQueryBuilder('u')
      .select('u.id', 'id')
      .addSelect('u.username', 'username')
      .addSelect('u."displayName"', 'displayName')
      .addSelect('u."avatarEmoji"', 'avatarEmoji')
      .addSelect('u."totalPoints"', 'points')
      .addSelect('u."gamesPlayed"', 'gamesPlayed')
      .addSelect('u."sessionsWon"', 'sessionsWon')
      .addSelect('u.streak', 'streak')
      .addSelect('u."maxStreak"', 'maxStreak')
      .where('u.role = :role', { role: UserRole.PLAYER })
      .orderBy('points', 'DESC')
      .addOrderBy('u.username', 'ASC')
      .getRawMany<RankingRow>();

    return this.mapRowsToRanking(rows);
  }

  private mapRowsToRanking(rows: RankingRow[]): RankingPlayerEntry[] {
    return rows.map((row, idx) => ({
      rank: idx + 1,
      id: row.id,
      displayName: row.displayName,
      username: row.username,
      avatarEmoji: row.avatarEmoji,
      totalPoints: Number(row.points),
      gamesPlayed: Number(row.gamesPlayed),
      sessionsWon: Number(row.sessionsWon),
      accuracy:
        Number(row.gamesPlayed) > 0
          ? Math.round((Number(row.sessionsWon) / Number(row.gamesPlayed)) * 100)
          : 0,
      streak: Number(row.streak),
      maxStreak: Number(row.maxStreak),
    }));
  }
}

import { User } from '../users/user.entity';
import { ScoringGame, ScoringGameType } from './scoring.constants';

export interface ApplyGameScoreInput {
  userId: string;
  game: ScoringGame;
  rawPoints: number;
  sessionWon?: boolean;
  source?: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
}

export interface ApplyGameScoreResult {
  game: ScoringGame;
  gameType: ScoringGameType;
  rawPoints: number;
  normalizedPoints: number;
  awardedPoints: number;
  dailyAwardLimit: number | null;
  awardedCountToday: number;
  remainingAwardsToday: number | null;
  dailyCapApplied: boolean;
  updatedUser: User;
}

export interface DailyScoringStatusItem {
  game: ScoringGame;
  gameType: ScoringGameType;
  dailyAwardLimit: number | null;
  awardedCountToday: number;
  remainingAwardsToday: number | null;
  canStillScore: boolean;
}

export interface DailyScoringStatusResponse {
  general: DailyScoringStatusItem[];
  individual: DailyScoringStatusItem[];
}

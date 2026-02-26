export type ScoringGame =
  | 'quiz'
  | 'defense_zone'
  | 'reception_5_1'
  | 'duel'
  | 'role_reception'
  | 'role_defense';

export type ScoringGameType = 'general' | 'individual';

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


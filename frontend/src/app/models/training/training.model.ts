export interface PlacementInput {
  playerId: number;
  x: number;
  y: number;
}

export interface RotationRoundCheckRequest {
  rotation: number;
  elapsedSeconds: number;
  placements: PlacementInput[];
  system?: '5-1' | '4-2' | '6-2';
}

export interface DefenseZoneCheckRequest {
  scenarioId: number;
  placements: PlacementInput[];
}

export interface RoleReceptionCheckRequest {
  rotation: number;
  roleId: number;
  elapsedSeconds: number;
  placement: {
    x: number;
    y: number;
  };
}

export interface RoleDefenseCheckRequest {
  roundId: number;
  roleId: number;
  elapsedSeconds: number;
  placement: {
    x: number;
    y: number;
  };
}

export type TrainingGameId =
  | 'defense_zone'
  | 'reception_5_1'
  | 'reception_4_2'
  | 'reception_6_2'
  | 'role_reception'
  | 'role_defense';

export interface CompleteTrainingGameRequest {
  game: TrainingGameId;
  rawPoints: number;
  roundsCompleted?: number;
  roundsCorrect?: number;
  source?: string;
}

export interface UnlockedAchievement {
  code: string;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
  rewardPoints: number;
  unlockedAt: string;
}

export interface PerPlayerCheck {
  playerId: number;
  correct: boolean;
}

export interface RotationRoundCheckResponse {
  perPlayer: PerPlayerCheck[];
  correctCount: number;
  roundPoints: number;
}

export interface DefenseZoneCheckResponse {
  perPlayer: PerPlayerCheck[];
  correctCount: number;
}

export interface RoleCheckResponse {
  correct: boolean;
  roundPoints: number;
  target: {
    zone: number;
    point: {
      x: number;
      y: number;
      tolerance?: number;
    };
  };
}

export interface CompleteTrainingGameResponse {
  game: TrainingGameId;
  gameType: 'general' | 'individual';
  rawPoints: number;
  normalizedPoints: number;
  awardedPoints: number;
  dailyAwardLimit: number | null;
  awardedCountToday: number;
  remainingAwardsToday: number | null;
  dailyCapApplied: boolean;
  totalPoints: number;
  gamesPlayed: number;
  unlockedAchievements?: UnlockedAchievement[];
}

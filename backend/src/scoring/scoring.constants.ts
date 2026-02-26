export enum ScoringGame {
  QUIZ = 'quiz',
  DEFENSE_ZONE = 'defense_zone',
  RECEPTION_5_1 = 'reception_5_1',
  RECEPTION_4_2 = 'reception_4_2',
  RECEPTION_6_2 = 'reception_6_2',
  DUEL = 'duel',
  ROLE_RECEPTION = 'role_reception',
  ROLE_DEFENSE = 'role_defense',
}

export enum ScoringGameType {
  GENERAL = 'general',
  INDIVIDUAL = 'individual',
}

export interface GameScoringPolicy {
  gameType: ScoringGameType;
  maxRawPointsPerRun: number;
  baseMultiplier: number;
  maxAwardedPerRun: number;
  dailyAwardLimit: number | null;
  secondAwardMultiplier?: number;
  winThresholdRawPoints?: number;
}

// Politica de puntuacion:
// - Juegos generales: puntuan mas, pero solo 2 veces al dia por juego.
// - Juegos individuales: puntuan siempre, pero muy poco.
export const GAME_SCORING_POLICY: Record<ScoringGame, GameScoringPolicy> = {
  [ScoringGame.QUIZ]: {
    gameType: ScoringGameType.GENERAL,
    maxRawPointsPerRun: 1800,
    baseMultiplier: 1,
    maxAwardedPerRun: 1400,
    dailyAwardLimit: 2,
    secondAwardMultiplier: 0.7,
    winThresholdRawPoints: 700,
  },
  [ScoringGame.DEFENSE_ZONE]: {
    gameType: ScoringGameType.GENERAL,
    maxRawPointsPerRun: 900,
    baseMultiplier: 1,
    maxAwardedPerRun: 900,
    dailyAwardLimit: 2,
    secondAwardMultiplier: 0.7,
    winThresholdRawPoints: 450,
  },
  [ScoringGame.RECEPTION_5_1]: {
    gameType: ScoringGameType.GENERAL,
    maxRawPointsPerRun: 2200,
    baseMultiplier: 0.42,
    maxAwardedPerRun: 900,
    dailyAwardLimit: 2,
    secondAwardMultiplier: 0.7,
    winThresholdRawPoints: 1000,
  },
  [ScoringGame.RECEPTION_4_2]: {
    gameType: ScoringGameType.GENERAL,
    maxRawPointsPerRun: 2200,
    baseMultiplier: 0.42,
    maxAwardedPerRun: 900,
    dailyAwardLimit: 2,
    secondAwardMultiplier: 0.7,
    winThresholdRawPoints: 1000,
  },
  [ScoringGame.RECEPTION_6_2]: {
    gameType: ScoringGameType.GENERAL,
    maxRawPointsPerRun: 2200,
    baseMultiplier: 0.42,
    maxAwardedPerRun: 900,
    dailyAwardLimit: 2,
    secondAwardMultiplier: 0.7,
    winThresholdRawPoints: 1000,
  },
  [ScoringGame.DUEL]: {
    gameType: ScoringGameType.GENERAL,
    maxRawPointsPerRun: 800,
    baseMultiplier: 0.9,
    maxAwardedPerRun: 650,
    dailyAwardLimit: 2,
    secondAwardMultiplier: 0.7,
    winThresholdRawPoints: 300,
  },
  [ScoringGame.ROLE_RECEPTION]: {
    gameType: ScoringGameType.INDIVIDUAL,
    maxRawPointsPerRun: 600,
    baseMultiplier: 0.015,
    maxAwardedPerRun: 10,
    dailyAwardLimit: null,
    winThresholdRawPoints: 180,
  },
  [ScoringGame.ROLE_DEFENSE]: {
    gameType: ScoringGameType.INDIVIDUAL,
    maxRawPointsPerRun: 650,
    baseMultiplier: 0.015,
    maxAwardedPerRun: 10,
    dailyAwardLimit: null,
    winThresholdRawPoints: 180,
  },
};

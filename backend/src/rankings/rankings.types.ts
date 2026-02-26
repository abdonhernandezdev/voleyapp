export type RankingMode = 'weekly' | 'global';

export interface RankingPlayerEntry {
  rank: number;
  id: string;
  displayName: string;
  username: string;
  avatarEmoji: string;
  /** Puntos mostrados en el ranking segun modo (semanal o global) */
  totalPoints: number;
  gamesPlayed: number;
  /** Sesiones en las que el jugador respondió correctamente más del 50% de preguntas */
  sessionsWon: number;
  /** Porcentaje de sesiones ganadas sobre sesiones jugadas */
  accuracy: number;
  streak: number;
  maxStreak: number;
}

export interface PlayerPositionResponse {
  position: number;
  total: number;
  player?: RankingPlayerEntry;
  surrounding: RankingPlayerEntry[];
}

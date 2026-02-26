export type RankingMode = 'weekly' | 'global';

export interface RankingEntry {
  rank: number;
  id: string;
  displayName: string;
  username: string;
  avatarEmoji: string;
  /** Puntos mostrados segun el modo de ranking seleccionado */
  totalPoints: number;
  gamesPlayed: number;
  /** Sesiones ganadas (>50% respuestas correctas) */
  sessionsWon: number;
  /** Porcentaje de sesiones ganadas sobre jugadas */
  accuracy: number;
  streak: number;
  maxStreak: number;
}

/** Refleja la respuesta real del backend: PlayerPositionResponse */
export interface RankingPosition {
  position: number;
  total: number;
  player?: RankingEntry;
  surrounding: RankingEntry[];
}

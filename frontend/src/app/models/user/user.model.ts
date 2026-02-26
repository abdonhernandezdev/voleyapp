export type UserRole = 'player' | 'coach';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarEmoji: string;
  streakReminderEmailEnabled?: boolean;
  role: UserRole;
  totalPoints: number;
  gamesPlayed: number;
  /** Sesiones en las que el jugador respondió correctamente más del 50% */
  sessionsWon: number;
  streak: number;
  maxStreak: number;
  lastPlayedAt?: string;
  createdAt: string;
}

import { Question, QuestionCategory } from '@models/question.model';
import { Achievement } from '@models/achievement.model';

export type GameMode = 'quick' | 'category' | 'challenge';

export interface GameSession {
  id: string;
  userId: string;
  mode: GameMode;
  category?: QuestionCategory;
  totalQuestions: number;
  correctAnswers: number;
  pointsEarned: number;
  timeSpentSeconds: number;
  completed: boolean;
  createdAt: string;
  scoring?: SessionScoringSummary;
  unlockedAchievements?: Achievement[];
}

export interface SessionScoringSummary {
  game: 'quiz' | 'defense_zone' | 'reception_5_1' | 'duel' | 'role_reception' | 'role_defense';
  gameType: 'general' | 'individual';
  rawPoints: number;
  normalizedPoints: number;
  awardedPoints: number;
  dailyAwardLimit: number | null;
  awardedCountToday: number;
  remainingAwardsToday: number | null;
  dailyCapApplied: boolean;
}

export interface SessionStartResponse {
  session: GameSession;
  questions: Question[];
}

export interface AnswerResult {
  correct: boolean;
  selectedOptionIndex: number;
  correctOptionIndex: number | null;
  pointsEarned: number;
  totalPoints: number;
}

export interface CategoryStats {
  sessions: number;
  totalPoints: number;
  accuracy: number;
}

/** Refleja la respuesta real del backend: UserSessionsStatsResponse */
export interface UserStats {
  totalSessions: number;
  totalPoints: number;
  overallAccuracy: number;
  byCategory: Record<QuestionCategory, CategoryStats>;
}

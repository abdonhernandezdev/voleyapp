import { QuestionCategory } from '../questions/question.entity';
import { GameSession } from './game-session.entity';
import { PublicQuestion } from '../questions/question-public.types';
import { UnlockedAchievementPayload } from '../achievements/achievements.types';
import { ScoringGame, ScoringGameType } from '../scoring/scoring.constants';

export interface StartSessionResponse {
  session: GameSession;
  questions: PublicQuestion[];
}

export interface SubmitAnswerResponse {
  correct: boolean;
  selectedOptionIndex: number;
  correctOptionIndex: number | null;
  pointsEarned: number;
  totalPoints: number;
}

export interface CategorySessionStats {
  sessions: number;
  totalPoints: number;
  accuracy: number;
}

export type StatsByCategory = Record<QuestionCategory, CategorySessionStats>;

export interface UserSessionsStatsResponse {
  totalSessions: number;
  totalPoints: number;
  overallAccuracy: number;
  byCategory: StatsByCategory;
}

export type CompleteSessionResponse = GameSession & {
  scoring?: {
    game: ScoringGame;
    gameType: ScoringGameType;
    rawPoints: number;
    normalizedPoints: number;
    awardedPoints: number;
    dailyAwardLimit: number | null;
    awardedCountToday: number;
    remainingAwardsToday: number | null;
    dailyCapApplied: boolean;
  };
  unlockedAchievements?: UnlockedAchievementPayload[];
};

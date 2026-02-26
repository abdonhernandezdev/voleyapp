import { AchievementDefinition } from './achievement.constants';
import { QuestionCategory } from '../questions/question.entity';

export interface AchievementProgress extends AchievementDefinition {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: AchievementProgressInfo | null;
}

export interface UnlockedAchievementPayload extends AchievementDefinition {
  unlockedAt: string;
}

export interface AchievementProgressInfo {
  current: number;
  target: number;
  percent: number;
  text: string;
}

export interface CategoryAggregateRaw {
  correct: string;
  total: string;
}

export interface SessionContext {
  sessionCategory: QuestionCategory | null;
  sessionPoints: number;
  sessionPerfect: boolean;
}

import { GameMode } from '../game-sessions/game-session.entity';
import { Difficulty, QuestionCategory, QuestionType } from '../questions/question.entity';
import { AssignmentTargetType } from './coach-assignment.entity';

export interface CoachQuestionItem {
  id: string;
  type: QuestionType;
  category: QuestionCategory;
  difficulty: Difficulty;
  question: string;
  explanation: string | null;
  options: string[] | null;
  correctOptionIndex: number | null;
  isActive: boolean;
  isCustom: boolean;
  createdByCoachId: string | null;
  timesAnswered: number;
  timesCorrect: number;
  accuracy: number;
  createdAt: Date;
}

export interface AssignmentProgressPlayer {
  userId: string;
  displayName: string;
  username: string;
  completed: boolean;
  matchedSessions: number;
  lastCompletedAt: string | null;
}

export interface CoachAssignmentWithProgress {
  id: string;
  title: string;
  description: string | null;
  mode: GameMode;
  category: QuestionCategory | null;
  targetType: AssignmentTargetType;
  targetUserId: string | null;
  dueDate: string | null;
  isActive: boolean;
  createdAt: string;
  completion: {
    completedPlayers: number;
    totalPlayers: number;
    percent: number;
    players: AssignmentProgressPlayer[];
  };
}

export interface PlayerAssignmentItem {
  id: string;
  title: string;
  description: string | null;
  mode: GameMode;
  category: QuestionCategory | null;
  dueDate: string | null;
  createdAt: string;
  completed: boolean;
  matchedSessions: number;
  lastCompletedAt: string | null;
}

export interface CoachPlayerAnalytics {
  player: {
    id: string;
    displayName: string;
    username: string;
    totalPoints: number;
    gamesPlayed: number;
    sessionsWon: number;
    streak: number;
    maxStreak: number;
  };
  period: {
    weeks: number;
    from: string;
    to: string;
  };
  weeklyEvolution: Array<{
    weekStart: string;
    sessions: number;
    points: number;
    accuracy: number;
  }>;
  weakCategories: Array<{
    category: QuestionCategory;
    sessions: number;
    accuracy: number;
  }>;
  comparison: {
    teamSize: number;
    pointsRank: number;
    accuracyRank: number;
    averageTeamAccuracy: number;
  };
}

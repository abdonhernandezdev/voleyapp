import { Difficulty, QuestionCategory, QuestionType } from '@models/question.model';

export interface CoachManagedQuestion {
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
  createdAt: string;
}

export interface CreateCoachQuestionPayload {
  type: QuestionType;
  category: QuestionCategory;
  difficulty: Difficulty;
  question: string;
  explanation?: string;
  options?: string[];
  correctOptionIndex?: number;
}

export interface UpdateCoachQuestionPayload {
  category?: QuestionCategory;
  difficulty?: Difficulty;
  question?: string;
  explanation?: string;
  options?: string[];
  correctOptionIndex?: number;
  isActive?: boolean;
}

export type AssignmentTargetType = 'all_players' | 'player';
export type AssignmentMode = 'quick' | 'category' | 'challenge';

export interface CoachAssignmentProgressPlayer {
  userId: string;
  displayName: string;
  username: string;
  completed: boolean;
  matchedSessions: number;
  lastCompletedAt: string | null;
}

export interface CoachAssignment {
  id: string;
  title: string;
  description: string | null;
  mode: AssignmentMode;
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
    players: CoachAssignmentProgressPlayer[];
  };
}

export interface CreateCoachAssignmentPayload {
  title: string;
  description?: string;
  mode: AssignmentMode;
  category?: QuestionCategory;
  targetType: AssignmentTargetType;
  targetUserId?: string;
  dueDate?: string;
}

export interface UpdateCoachAssignmentPayload {
  title?: string;
  description?: string;
  mode?: AssignmentMode;
  category?: QuestionCategory | null;
  targetType?: AssignmentTargetType;
  targetUserId?: string | null;
  dueDate?: string | null;
  isActive?: boolean;
}

export interface PlayerAssignment {
  id: string;
  title: string;
  description: string | null;
  mode: AssignmentMode;
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

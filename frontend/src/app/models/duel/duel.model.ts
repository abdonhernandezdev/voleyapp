import { QuestionCategory } from '@models/question.model';

export interface DuelPlayer {
  userId: string;
  displayName: string;
  avatarEmoji: string;
  score: number;
}

export interface DuelQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  options: string[];
}

export interface DuelState {
  roomCode: string;
  hostUserId: string;
  status: 'waiting' | 'active' | 'finished';
  category: QuestionCategory | null;
  players: DuelPlayer[];
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: DuelQuestion | null;
  canStart: boolean;
  winnerUserId: string | null;
}

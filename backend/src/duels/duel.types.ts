import { QuestionCategory } from '../questions/question.entity';

export interface DuelAuthenticatedUser {
  id: string;
  displayName: string;
  avatarEmoji: string;
}

export interface DuelQuestionPublic {
  id: string;
  category: QuestionCategory;
  question: string;
  options: string[];
}

export interface DuelPlayerPublic {
  userId: string;
  displayName: string;
  avatarEmoji: string;
  score: number;
}

export interface DuelStatePublic {
  roomCode: string;
  hostUserId: string;
  status: 'waiting' | 'active' | 'finished';
  category: QuestionCategory | null;
  players: DuelPlayerPublic[];
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: DuelQuestionPublic | null;
  canStart: boolean;
  winnerUserId: string | null;
}

export interface DuelCreatePayload {
  category?: QuestionCategory;
}

export interface DuelJoinPayload {
  roomCode: string;
}

export interface DuelAnswerPayload {
  roomCode: string;
  questionId: string;
  selectedOptionIndex: number;
  timeSeconds: number;
}

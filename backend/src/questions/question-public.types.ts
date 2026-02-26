import { Difficulty, QuestionCategory, QuestionType } from './question.entity';

export interface PublicFieldConfig {
  positions: Array<{
    id: number;
    label: string;
    role?: string;
  }>;
  players: Array<{
    id: number;
    name: string;
    role: string;
  }>;
}

export interface PublicRotationConfig {
  rotationNumber: number;
  phase: 'K1' | 'K2';
  playerPositions: Array<{ zone: number; role: string }>;
  targetRole?: string;
}

export interface PublicQuestion {
  id: string;
  type: QuestionType;
  category: QuestionCategory;
  difficulty: Difficulty;
  question: string;
  explanation: string | null;
  options: string[] | null;
  fieldConfig: PublicFieldConfig | null;
  rotationConfig: PublicRotationConfig | null;
}


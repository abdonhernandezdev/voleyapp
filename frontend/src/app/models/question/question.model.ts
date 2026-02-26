export type QuestionType = 'quiz' | 'field_drag' | 'rotation';
export type QuestionCategory =
  | 'rotations_k1'
  | 'rotations_k2'
  | 'positions_roles'
  | 'game_systems'
  | 'basic_rules';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  type: QuestionType;
  category: QuestionCategory;
  difficulty: Difficulty;
  question: string;
  explanation?: string;
  options?: string[];
  fieldConfig?: FieldConfig;
  rotationConfig?: RotationConfig;
}

export interface FieldConfig {
  positions: Array<{ id: number; label: string; role?: string }>;
  players: Array<{ id: number; name: string; role: string }>;
}

export interface RotationConfig {
  rotationNumber: number;
  phase: 'K1' | 'K2';
  playerPositions: Array<{ zone: number; role: string }>;
  targetRole?: string;
}

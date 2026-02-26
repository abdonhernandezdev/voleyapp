import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum QuestionType {
  QUIZ = 'quiz',           // Pregunta con 4 opciones
  FIELD_DRAG = 'field_drag', // Coloca jugadores en el campo
  ROTATION = 'rotation',   // Identifica la rotación correcta
}

export enum QuestionCategory {
  ROTATIONS_K1 = 'rotations_k1',
  ROTATIONS_K2 = 'rotations_k2',
  POSITIONS_ROLES = 'positions_roles',
  GAME_SYSTEMS = 'game_systems',
  BASIC_RULES = 'basic_rules',
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: QuestionType,
  })
  type: QuestionType;

  @Column({
    type: 'enum',
    enum: QuestionCategory,
  })
  category: QuestionCategory;

  @Column({
    type: 'enum',
    enum: Difficulty,
    default: Difficulty.EASY,
  })
  difficulty: Difficulty;

  @Column()
  question: string;

  @Column({ nullable: true, type: 'text' })
  explanation: string;

  // Para QUIZ: array de opciones
  @Column({ type: 'jsonb', nullable: true })
  options: string[];

  // Para QUIZ: índice de la opción correcta
  @Column({ nullable: true })
  correctOptionIndex: number;

  // Para FIELD_DRAG: configuración de posiciones
  @Column({ type: 'jsonb', nullable: true })
  fieldConfig: {
    positions: Array<{
      id: number;
      label: string;   // e.g. "Z1", "Z2"...
      role?: string;   // e.g. "Líbero", "Colocador"
    }>;
    players: Array<{
      id: number;
      name: string;
      role: string;
    }>;
    correctMapping: Record<string, number>; // playerId -> positionId
  };

  // Para ROTATION: número de rotación a identificar
  @Column({ type: 'jsonb', nullable: true })
  rotationConfig: {
    rotationNumber: number;
    phase: 'K1' | 'K2';
    playerPositions: Array<{ zone: number; role: string }>;
    correctZone?: number;
    targetRole?: string;
  };

  @Column({ default: 0 })
  timesAnswered: number;

  @Column({ default: 0 })
  timesCorrect: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isCustom: boolean;

  @Column({ nullable: true })
  createdByCoachId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

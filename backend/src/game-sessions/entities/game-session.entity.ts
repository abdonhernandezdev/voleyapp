import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, JoinColumn, Index,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { QuestionCategory } from '../../questions/question.entity';

export enum GameMode {
  QUICK = 'quick',         // 10 preguntas aleatorias
  CATEGORY = 'category',   // categoría específica
  CHALLENGE = 'challenge',  // modo contra-reloj
}

@Entity('game_sessions')
export class GameSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'enum', enum: GameMode, default: GameMode.QUICK })
  mode: GameMode;

  @Column({ type: 'enum', enum: QuestionCategory, nullable: true })
  category: QuestionCategory;

  @Column({ default: 0 })
  totalQuestions: number;

  @Column({ default: 0 })
  correctAnswers: number;

  @Column({ default: 0 })
  pointsEarned: number;

  @Column({ default: 0 })
  timeSpentSeconds: number;

  @Column({ type: 'jsonb', default: [] })
  questionIds: string[];

  // Detalle de cada respuesta
  @Column({ type: 'jsonb', default: [] })
  answers: Array<{
    questionId: string;
    correct: boolean;
    selectedOptionIndex: number;
    timeSeconds: number;
    pointsEarned: number;
  }>;

  @Column({ default: false })
  completed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

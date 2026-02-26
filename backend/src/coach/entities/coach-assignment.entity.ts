import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GameMode } from '../../game-sessions/game-session.entity';
import { QuestionCategory } from '../../questions/question.entity';

export enum AssignmentTargetType {
  ALL_PLAYERS = 'all_players',
  PLAYER = 'player',
}

@Entity('coach_assignments')
export class CoachAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  coachId: string;

  @Column({ length: 120 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: GameMode })
  mode: GameMode;

  @Column({ type: 'enum', enum: QuestionCategory, nullable: true })
  category: QuestionCategory | null;

  @Column({ type: 'enum', enum: AssignmentTargetType, default: AssignmentTargetType.ALL_PLAYERS })
  targetType: AssignmentTargetType;

  @Index()
  @Column({ nullable: true })
  targetUserId: string | null;

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

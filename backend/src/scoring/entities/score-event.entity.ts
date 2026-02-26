import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { ScoringGame, ScoringGameType } from '../scoring.constants';

@Entity('score_events')
@Index(['userId', 'game', 'createdAt'])
export class ScoreEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'enum', enum: ScoringGame })
  game: ScoringGame;

  @Column({ type: 'enum', enum: ScoringGameType })
  gameType: ScoringGameType;

  @Column({ default: 0 })
  rawPoints: number;

  @Column({ default: 0 })
  normalizedPoints: number;

  @Column({ default: 0 })
  awardedPoints: number;

  @Column({ type: 'int', nullable: true })
  dailyAwardLimit: number | null;

  @Column({ default: 0 })
  awardedCountToday: number;

  @Column({ default: false })
  dailyCapApplied: boolean;

  @Column({ nullable: true })
  source: string | null;

  @Column({ nullable: true })
  sourceId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Reward } from './reward.entity';

export enum RedemptionStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('reward_redemptions')
export class RewardRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  rewardId: string;

  @ManyToOne(() => Reward, { eager: false })
  @JoinColumn({ name: 'rewardId' })
  reward: Reward;

  @Index()
  @Column()
  playerId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'playerId' })
  player: User;

  @Index()
  @Column({ type: 'enum', enum: RedemptionStatus, default: RedemptionStatus.PENDING })
  status: RedemptionStatus;

  @Column()
  pointsSpent: number;

  @CreateDateColumn()
  redeemedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}

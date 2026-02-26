import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('rewards')
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  coachId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'coachId' })
  coach: User;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column()
  pointCost: number;

  @Column({ type: 'int', nullable: true })
  stock: number | null;

  @Column({ default: 0 })
  stockUsed: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('streak_reminder_logs')
@Unique('UQ_streak_reminder_user_day', ['userId', 'reminderDate'])
export class StreakReminderLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({ type: 'date' })
  reminderDate: string;

  @Column({ default: 'email' })
  channel: string;

  @Column({ default: 'sent' })
  status: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

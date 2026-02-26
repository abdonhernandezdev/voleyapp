import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('user_achievements')
@Unique('UQ_user_achievements_user_code', ['userId', 'code'])
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({ length: 80 })
  code: string;

  @CreateDateColumn()
  unlockedAt: Date;
}

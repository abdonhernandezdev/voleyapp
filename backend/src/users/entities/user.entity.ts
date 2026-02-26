import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  PLAYER = 'player',
  COACH = 'coach',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  avatarEmoji: string; // icon name (e.g. 'sports_volleyball')

  @Column({ default: false })
  streakReminderEmailEnabled: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PLAYER,
  })
  role: UserRole;

  @Column({ default: 0 })
  totalPoints: number;

  @Column({ default: 0 })
  gamesPlayed: number;

  /**
   * Número de sesiones completadas en las que el usuario respondió
   * correctamente más de la mitad de las preguntas.
   * Nota: NO cuenta respuestas individuales correctas.
   */
  @Column({ default: 0 })
  sessionsWon: number;

  @Column({ default: 0 })
  streak: number; // racha actual de días

  @Column({ default: 0 })
  maxStreak: number;

  @Column({ nullable: true })
  lastPlayedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

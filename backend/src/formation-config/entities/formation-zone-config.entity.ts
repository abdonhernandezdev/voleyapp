import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('formation_zone_configs')
@Index(['gameFamily', 'system', 'idx', 'playerId'], { unique: true })
export class FormationZoneConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  gameFamily: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  system: string | null;

  @Column({ type: 'int' })
  idx: number;

  @Column({ type: 'int' })
  playerId: number;

  @Column({ type: 'float' })
  x: number;

  @Column({ type: 'float' })
  y: number;

  @Column({ type: 'float' })
  w: number;

  @Column({ type: 'float' })
  h: number;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { envConfig } from '../config/env.config';

export type PublicUserProfile = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  private static readonly PUBLIC_PROFILE_FIELDS = [
    'id',
    'username',
    'displayName',
    'avatarEmoji',
    'streakReminderEmailEnabled',
    'role',
    'totalPoints',
    'gamesPlayed',
    'sessionsWon',
    'streak',
    'maxStreak',
    'lastPlayedAt',
    'createdAt',
  ] as const;

  private static readonly PLAYER_PROFILE_FIELDS = [
    'id',
    'username',
    'displayName',
    'avatarEmoji',
    'totalPoints',
    'gamesPlayed',
    'sessionsWon',
    'streak',
    'maxStreak',
    'lastPlayedAt',
  ] as const;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (existing) {
      throw new ConflictException('No se pudo crear la cuenta');
    }
    const hashed = await bcrypt.hash(dto.password, envConfig.auth.bcryptRounds);
    const user = this.userRepo.create({
      ...dto,
      role: UserRole.PLAYER,
      password: hashed,
      displayName: dto.displayName || dto.username,
      avatarEmoji: dto.avatarEmoji || 'sports_volleyball',
    });
    return this.userRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      select: [...UsersService.PUBLIC_PROFILE_FIELDS],
      order: { totalPoints: 'DESC' },
    });
  }

  async findPlayers(): Promise<User[]> {
    return this.userRepo.find({
      where: { role: UserRole.PLAYER },
      select: [...UsersService.PLAYER_PROFILE_FIELDS],
      order: { totalPoints: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUserProfile> {
    const user = await this.findById(id);
    Object.assign(user, dto);
    const updated = await this.userRepo.save(user);
    return this.toPublicProfile(updated);
  }

  /**
   * Actualiza puntos, racha y estadísticas del usuario de forma atómica
   * usando una transacción con SELECT FOR UPDATE para evitar race conditions
   * cuando múltiples peticiones llegan simultáneamente para el mismo usuario.
   */
  async addPoints(id: string, points: number, sessionWon: boolean): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      // SELECT FOR UPDATE: bloquea la fila hasta que la transacción termine,
      // evitando que otra petición lea el estado antiguo antes de que guardemos.
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.id = :id', { id })
        .getOne();

      if (!user) throw new NotFoundException('Usuario no encontrado');

      user.totalPoints += points;
      user.gamesPlayed += 1;
      if (sessionWon) user.sessionsWon += 1;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastPlayed = user.lastPlayedAt ? new Date(user.lastPlayedAt) : null;
      if (lastPlayed) lastPlayed.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (!lastPlayed) {
        // Primera sesión del usuario
        user.streak = 1;
      } else if (lastPlayed.getTime() === today.getTime()) {
        // Ya jugó hoy: la racha no cambia
      } else if (lastPlayed.getTime() === yesterday.getTime()) {
        // Jugó ayer: extiende la racha
        user.streak += 1;
      } else {
        // Lleva más de un día sin jugar: reinicia la racha
        user.streak = 1;
      }

      if (user.streak > user.maxStreak) user.maxStreak = user.streak;
      user.lastPlayedAt = new Date();

      return manager.getRepository(User).save(user);
    });
  }

  async deductPoints(id: string, points: number): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.id = :id', { id })
        .getOne();

      if (!user) throw new NotFoundException('Usuario no encontrado');
      if (user.totalPoints < points) {
        throw new BadRequestException('Puntos insuficientes');
      }

      user.totalPoints -= points;
      return manager.getRepository(User).save(user);
    });
  }

  async refundPoints(id: string, points: number): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.id = :id', { id })
        .getOne();

      if (!user) throw new NotFoundException('Usuario no encontrado');
      user.totalPoints += points;
      return manager.getRepository(User).save(user);
    });
  }

  async getProfile(id: string): Promise<PublicUserProfile> {
    const user = await this.findById(id);
    return this.toPublicProfile(user);
  }

  toPublicProfile(user: User): PublicUserProfile {
    const { password, ...profile } = user;
    return profile as PublicUserProfile;
  }
}

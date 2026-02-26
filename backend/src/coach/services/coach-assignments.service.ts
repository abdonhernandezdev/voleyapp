import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { User, UserRole } from '../../users/user.entity';
import { GameMode, GameSession } from '../../game-sessions/game-session.entity';
import {
  CoachAssignmentWithProgress,
  PlayerAssignmentItem,
} from '../coach.types';
import {
  CreateCoachAssignmentDto,
  UpdateCoachAssignmentDto,
} from '../dto/coach-assignment.dto';
import { AssignmentTargetType, CoachAssignment } from '../entities/coach-assignment.entity';

interface SessionProgressRaw {
  userId: string;
  matchedSessions: string;
  lastCompletedAt: Date | null;
}

@Injectable()
export class CoachAssignmentsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepo: Repository<GameSession>,
    @InjectRepository(CoachAssignment)
    private readonly assignmentRepo: Repository<CoachAssignment>,
  ) {}

  async createAssignment(
    coachId: string,
    dto: CreateCoachAssignmentDto,
  ): Promise<CoachAssignmentWithProgress> {
    const targetUserId = await this.validateAssignmentTarget(dto.targetType, dto.targetUserId);

    const assignment = this.assignmentRepo.create({
      coachId,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      mode: dto.mode,
      category: dto.category ?? null,
      targetType: dto.targetType,
      targetUserId,
      dueDate: dto.dueDate ?? null,
      isActive: true,
    });

    const saved = await this.assignmentRepo.save(assignment);
    return this.getAssignmentWithProgress(saved);
  }

  async updateAssignment(
    coachId: string,
    assignmentId: string,
    dto: UpdateCoachAssignmentDto,
  ): Promise<CoachAssignmentWithProgress> {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Asignación no encontrada');
    if (assignment.coachId !== coachId) {
      throw new ForbiddenException('No puedes modificar asignaciones de otro entrenador');
    }

    const nextTargetType = dto.targetType ?? assignment.targetType;
    const nextTargetUserId =
      dto.targetUserId !== undefined ? dto.targetUserId : assignment.targetUserId;
    const validatedTargetUserId = await this.validateAssignmentTarget(
      nextTargetType,
      nextTargetUserId ?? undefined,
    );

    assignment.title = dto.title?.trim() || assignment.title;
    assignment.description =
      dto.description !== undefined ? dto.description?.trim() || null : assignment.description;
    assignment.mode = dto.mode ?? assignment.mode;
    assignment.category =
      dto.category !== undefined ? dto.category : assignment.category;
    assignment.targetType = nextTargetType;
    assignment.targetUserId = validatedTargetUserId;
    assignment.dueDate = dto.dueDate !== undefined ? dto.dueDate : assignment.dueDate;
    assignment.isActive = dto.isActive ?? assignment.isActive;

    const saved = await this.assignmentRepo.save(assignment);
    return this.getAssignmentWithProgress(saved);
  }

  async deactivateAssignment(coachId: string, assignmentId: string): Promise<{ ok: true }> {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Asignación no encontrada');
    if (assignment.coachId !== coachId) {
      throw new ForbiddenException('No puedes modificar asignaciones de otro entrenador');
    }
    assignment.isActive = false;
    await this.assignmentRepo.save(assignment);
    return { ok: true };
  }

  async getAssignmentsForCoach(coachId: string): Promise<CoachAssignmentWithProgress[]> {
    const assignments = await this.assignmentRepo.find({
      where: { coachId },
      order: { createdAt: 'DESC' },
    });

    const result: CoachAssignmentWithProgress[] = [];
    for (const assignment of assignments) {
      result.push(await this.getAssignmentWithProgress(assignment));
    }
    return result;
  }

  async getAssignmentsForPlayer(userId: string): Promise<PlayerAssignmentItem[]> {
    const player = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'role'],
    });
    if (!player || player.role !== UserRole.PLAYER) {
      return [];
    }

    const assignments = await this.assignmentRepo
      .createQueryBuilder('a')
      .where('a."isActive" = true')
      .andWhere(
        new Brackets((qb) => {
          qb.where('a."targetType" = :allPlayers', {
            allPlayers: AssignmentTargetType.ALL_PLAYERS,
          }).orWhere('a."targetUserId" = :userId', { userId });
        }),
      )
      .orderBy('a."createdAt"', 'DESC')
      .getMany();

    const items: PlayerAssignmentItem[] = [];
    for (const assignment of assignments) {
      const progress = await this.getMatchedSessionsForAssignment(assignment, [userId]);
      const matched = progress.get(userId) ?? { sessions: 0, lastCompletedAt: null };
      items.push({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        mode: assignment.mode,
        category: assignment.category,
        dueDate: assignment.dueDate,
        createdAt: assignment.createdAt.toISOString(),
        completed: matched.sessions > 0,
        matchedSessions: matched.sessions,
        lastCompletedAt: matched.lastCompletedAt,
      });
    }
    return items;
  }

  async getAssignmentProgressForCoach(
    coachId: string,
    assignmentId: string,
  ): Promise<CoachAssignmentWithProgress> {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Asignación no encontrada');
    if (assignment.coachId !== coachId) {
      throw new ForbiddenException('No puedes ver asignaciones de otro entrenador');
    }
    return this.getAssignmentWithProgress(assignment);
  }

  private async validateAssignmentTarget(
    targetType: AssignmentTargetType,
    targetUserId?: string | null,
  ): Promise<string | null> {
    if (targetType === AssignmentTargetType.ALL_PLAYERS) {
      return null;
    }

    if (!targetUserId) {
      throw new BadRequestException('targetUserId es obligatorio cuando targetType=player');
    }

    const player = await this.userRepo.findOne({
      where: { id: targetUserId, role: UserRole.PLAYER },
    });
    if (!player) {
      throw new BadRequestException('El jugador objetivo no existe');
    }

    return player.id;
  }

  private async getAssignmentWithProgress(
    assignment: CoachAssignment,
  ): Promise<CoachAssignmentWithProgress> {
    const targetPlayers = await this.getAssignmentTargetPlayers(assignment);
    const targetPlayerIds = targetPlayers.map((player) => player.id);

    let matchedByUser = new Map<string, { sessions: number; lastCompletedAt: string | null }>();
    if (targetPlayerIds.length > 0) {
      matchedByUser = await this.getMatchedSessionsForAssignment(assignment, targetPlayerIds);
    }

    const players = targetPlayers.map((player) => {
      const matched = matchedByUser.get(player.id) ?? { sessions: 0, lastCompletedAt: null };
      return {
        userId: player.id,
        displayName: player.displayName,
        username: player.username,
        completed: matched.sessions > 0,
        matchedSessions: matched.sessions,
        lastCompletedAt: matched.lastCompletedAt,
      };
    });

    const completedPlayers = players.filter((player) => player.completed).length;
    const totalPlayers = players.length;
    const percent = totalPlayers ? Math.round((completedPlayers / totalPlayers) * 100) : 0;

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      mode: assignment.mode,
      category: assignment.category,
      targetType: assignment.targetType,
      targetUserId: assignment.targetUserId,
      dueDate: assignment.dueDate,
      isActive: assignment.isActive,
      createdAt: assignment.createdAt.toISOString(),
      completion: {
        completedPlayers,
        totalPlayers,
        percent,
        players,
      },
    };
  }

  private async getAssignmentTargetPlayers(
    assignment: CoachAssignment,
  ): Promise<Array<{ id: string; displayName: string; username: string }>> {
    if (assignment.targetType === AssignmentTargetType.PLAYER && assignment.targetUserId) {
      const player = await this.userRepo.findOne({
        where: { id: assignment.targetUserId, role: UserRole.PLAYER },
        select: ['id', 'displayName', 'username'],
      });
      return player ? [player] : [];
    }

    return this.userRepo.find({
      where: { role: UserRole.PLAYER },
      select: ['id', 'displayName', 'username'],
      order: { totalPoints: 'DESC' },
    });
  }

  private async getMatchedSessionsForAssignment(
    assignment: CoachAssignment,
    targetPlayerIds: string[],
  ): Promise<Map<string, { sessions: number; lastCompletedAt: string | null }>> {
    const qb = this.gameSessionRepo
      .createQueryBuilder('s')
      .select('s."userId"', 'userId')
      .addSelect('COUNT(*)', 'matchedSessions')
      .addSelect('MAX(s."createdAt")', 'lastCompletedAt')
      .where('s.completed = true')
      .andWhere('s."userId" IN (:...targetPlayerIds)', { targetPlayerIds })
      .andWhere('s."createdAt" >= :createdAt', { createdAt: assignment.createdAt.toISOString() })
      .groupBy('s."userId"');

    if (assignment.mode === GameMode.CHALLENGE) {
      qb.andWhere('s.mode = :mode', { mode: assignment.mode });
    } else if (assignment.category) {
      qb.andWhere('s.mode IN (:...modes)', {
        modes: [GameMode.QUICK, GameMode.CATEGORY],
      });
    } else {
      qb.andWhere('s.mode = :mode', { mode: assignment.mode });
    }

    if (assignment.category) {
      qb.andWhere('s.category = :category', { category: assignment.category });
    }

    if (assignment.dueDate) {
      const due = new Date(`${assignment.dueDate}T23:59:59.999Z`);
      qb.andWhere('s."createdAt" <= :dueDate', { dueDate: due.toISOString() });
    }

    const rows = await qb.getRawMany<SessionProgressRaw>();
    const progress = new Map<string, { sessions: number; lastCompletedAt: string | null }>();
    rows.forEach((row) => {
      progress.set(row.userId, {
        sessions: Number(row.matchedSessions),
        lastCompletedAt: row.lastCompletedAt ? new Date(row.lastCompletedAt).toISOString() : null,
      });
    });
    return progress;
  }
}

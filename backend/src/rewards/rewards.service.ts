import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Reward } from './reward.entity';
import { RewardRedemption, RedemptionStatus } from './reward-redemption.entity';
import { CreateRewardDto, DeliverRedemptionDto, UpdateRewardDto } from './dto/reward.dto';
import { UsersService } from '../users/users.service';
import { ScoreEvent } from '../scoring/score-event.entity';
import { User } from '../users/user.entity';
import { getSpainWeekRange } from '../common/time/spain-week.util';

export interface RewardListItem {
  id: string;
  coachId: string;
  name: string;
  description: string | null;
  pointCost: number;
  stock: number | null;
  stockAvailable: number | null;
  isActive: boolean;
  canAfford: boolean;
}

export interface RewardPointsBalance {
  weeklyEarnedPoints: number;
  weeklySpentPoints: number;
  weeklyAvailablePoints: number;
  totalPoints: number;
  weekStartUtc: string;
  weekEndUtc: string;
}

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,
    @InjectRepository(RewardRedemption)
    private readonly redemptionRepo: Repository<RewardRedemption>,
    @InjectRepository(ScoreEvent)
    private readonly scoreEventRepo: Repository<ScoreEvent>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  // --- Player endpoints ---

  async listActiveRewards(playerId: string): Promise<RewardListItem[]> {
    const balance = await this.getPlayerPointsBalance(playerId);
    const { start, end } = getSpainWeekRange();
    const rewards = await this.rewardRepo.find({
      where: { isActive: true },
      order: { pointCost: 'ASC' },
    });
    const weeklyUsedMap = await this.getWeeklyUsedStockByRewardIds(
      rewards.map((reward) => reward.id),
      start,
      end,
    );

    return rewards.map((reward) => ({
      id: reward.id,
      coachId: reward.coachId,
      name: reward.name,
      description: reward.description,
      pointCost: reward.pointCost,
      stock: reward.stock,
      stockAvailable:
        reward.stock === null
          ? null
          : Math.max(0, reward.stock - (weeklyUsedMap.get(reward.id) ?? 0)),
      isActive: reward.isActive,
      canAfford: balance.weeklyAvailablePoints >= reward.pointCost,
    }));
  }

  async getPlayerPointsBalance(playerId: string): Promise<RewardPointsBalance> {
    const player = await this.usersService.findById(playerId);
    const { start, end } = getSpainWeekRange();
    return this.buildPointsBalance(playerId, player.totalPoints, start, end);
  }

  async redeemReward(playerId: string, rewardId: string): Promise<RewardRedemption> {
    return this.dataSource.transaction(async (manager) => {
      const reward = await manager
        .getRepository(Reward)
        .createQueryBuilder('reward')
        .setLock('pessimistic_write')
        .where('reward.id = :rewardId', { rewardId })
        .andWhere('reward.isActive = true')
        .getOne();

      if (!reward) {
        throw new NotFoundException('Recompensa no encontrada o inactiva');
      }

      const { start, end } = getSpainWeekRange();
      const weeklyUsedMap = await this.getWeeklyUsedStockByRewardIds(
        [reward.id],
        start,
        end,
        manager,
      );
      const weeklyUsed = weeklyUsedMap.get(reward.id) ?? 0;

      if (reward.stock !== null && reward.stock - weeklyUsed <= 0) {
        throw new BadRequestException('No hay stock disponible para esta recompensa');
      }

      const player = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.id = :playerId', { playerId })
        .getOne();

      if (!player) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const balance = await this.buildPointsBalance(
        playerId,
        player.totalPoints,
        start,
        end,
        manager,
      );

      if (balance.weeklyAvailablePoints < reward.pointCost) {
        throw new BadRequestException('Puntos semanales insuficientes para canjear esta recompensa');
      }

      if (reward.stock !== null) {
        reward.stockUsed += 1;
        await manager.getRepository(Reward).save(reward);
      }

      const redemption = manager.getRepository(RewardRedemption).create({
        id: randomUUID(),
        rewardId: reward.id,
        playerId,
        status: RedemptionStatus.PENDING,
        pointsSpent: reward.pointCost,
      });

      return manager.getRepository(RewardRedemption).save(redemption);
    });
  }

  async getPlayerRedemptions(playerId: string): Promise<RewardRedemption[]> {
    return this.redemptionRepo.find({
      where: { playerId },
      relations: ['reward'],
      order: { redeemedAt: 'DESC' },
    });
  }

  // --- Coach endpoints ---

  async getCoachRewards(coachId: string): Promise<object[]> {
    const { start, end } = getSpainWeekRange();
    const rewards = await this.rewardRepo.find({
      where: { coachId },
      order: { createdAt: 'DESC' },
    });
    const weeklyUsedMap = await this.getWeeklyUsedStockByRewardIds(
      rewards.map((reward) => reward.id),
      start,
      end,
    );

    const results = await Promise.all(
      rewards.map(async (reward) => {
        const [redeemed, delivered, pending] = await Promise.all([
          this.redemptionRepo.count({ where: { rewardId: reward.id } }),
          this.redemptionRepo.count({ where: { rewardId: reward.id, status: RedemptionStatus.DELIVERED } }),
          this.redemptionRepo.count({ where: { rewardId: reward.id, status: RedemptionStatus.PENDING } }),
        ]);
        return {
          id: reward.id,
          name: reward.name,
          description: reward.description,
          pointCost: reward.pointCost,
          stock: reward.stock,
          stockUsed: reward.stockUsed,
          stockAvailable:
            reward.stock === null
              ? null
              : Math.max(0, reward.stock - (weeklyUsedMap.get(reward.id) ?? 0)),
          isActive: reward.isActive,
          createdAt: reward.createdAt,
          stats: { redeemed, delivered, pending },
        };
      }),
    );

    return results;
  }

  async createReward(coachId: string, dto: CreateRewardDto): Promise<Reward> {
    const reward = this.rewardRepo.create({
      id: randomUUID(),
      coachId,
      name: dto.name,
      description: dto.description ?? null,
      pointCost: dto.pointCost,
      stock: dto.stock ?? null,
    });
    return this.rewardRepo.save(reward);
  }

  async updateReward(coachId: string, rewardId: string, dto: UpdateRewardDto): Promise<Reward> {
    const reward = await this.rewardRepo.findOne({ where: { id: rewardId, coachId } });
    if (!reward) {
      throw new NotFoundException('Recompensa no encontrada');
    }
    Object.assign(reward, dto);
    return this.rewardRepo.save(reward);
  }

  async deactivateReward(coachId: string, rewardId: string): Promise<void> {
    const reward = await this.rewardRepo.findOne({ where: { id: rewardId, coachId } });
    if (!reward) {
      throw new NotFoundException('Recompensa no encontrada');
    }
    reward.isActive = false;
    await this.rewardRepo.save(reward);
  }

  async getCoachRedemptions(
    coachId: string,
    status?: RedemptionStatus,
  ): Promise<RewardRedemption[]> {
    const coachRewardIds = await this.rewardRepo
      .find({ where: { coachId }, select: ['id'] })
      .then((rewards) => rewards.map((r) => r.id));

    if (coachRewardIds.length === 0) return [];

    const query = this.redemptionRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.reward', 'reward')
      .leftJoinAndSelect('r.player', 'player')
      .where('r.rewardId IN (:...ids)', { ids: coachRewardIds })
      .orderBy('r.redeemedAt', 'DESC');

    if (status) {
      query.andWhere('r.status = :status', { status });
    }

    return query.getMany();
  }

  async deliverRedemption(
    coachId: string,
    redemptionId: string,
    dto: DeliverRedemptionDto,
  ): Promise<RewardRedemption> {
    const redemption = await this.findRedemptionForCoach(coachId, redemptionId);
    if (redemption.status !== RedemptionStatus.PENDING) {
      throw new BadRequestException('Solo se pueden entregar canjes pendientes');
    }
    redemption.status = RedemptionStatus.DELIVERED;
    redemption.deliveredAt = new Date();
    if (dto.notes) redemption.notes = dto.notes;
    return this.redemptionRepo.save(redemption);
  }

  async cancelRedemption(coachId: string, redemptionId: string): Promise<RewardRedemption> {
    const redemption = await this.findRedemptionForCoach(coachId, redemptionId);
    if (redemption.status !== RedemptionStatus.PENDING) {
      throw new BadRequestException('Solo se pueden cancelar canjes pendientes');
    }

    redemption.status = RedemptionStatus.CANCELLED;
    redemption.cancelledAt = new Date();
    await this.redemptionRepo.save(redemption);

    const reward = await this.rewardRepo.findOne({ where: { id: redemption.rewardId } });
    if (reward && reward.stock !== null && reward.stockUsed > 0) {
      reward.stockUsed -= 1;
      await this.rewardRepo.save(reward);
    }

    return redemption;
  }

  private async findRedemptionForCoach(
    coachId: string,
    redemptionId: string,
  ): Promise<RewardRedemption> {
    const redemption = await this.redemptionRepo.findOne({
      where: { id: redemptionId },
      relations: ['reward'],
    });
    if (!redemption) {
      throw new NotFoundException('Canje no encontrado');
    }
    if (redemption.reward.coachId !== coachId) {
      throw new ForbiddenException('No tienes permiso sobre este canje');
    }
    return redemption;
  }

  private async buildPointsBalance(
    playerId: string,
    totalPoints: number,
    weekStart: Date,
    weekEnd: Date,
    manager?: EntityManager,
  ): Promise<RewardPointsBalance> {
    const scoreRepo = manager ? manager.getRepository(ScoreEvent) : this.scoreEventRepo;
    const redemptionRepo = manager
      ? manager.getRepository(RewardRedemption)
      : this.redemptionRepo;

    const [earnedRow, spentRow] = await Promise.all([
      scoreRepo
        .createQueryBuilder('event')
        .select('COALESCE(SUM(event."awardedPoints"), 0)', 'points')
        .where('event."userId" = :playerId', { playerId })
        .andWhere('event."createdAt" >= :weekStart', { weekStart })
        .andWhere('event."createdAt" < :weekEnd', { weekEnd })
        .getRawOne<{ points: string }>(),
      redemptionRepo
        .createQueryBuilder('redemption')
        .select('COALESCE(SUM(redemption."pointsSpent"), 0)', 'points')
        .where('redemption."playerId" = :playerId', { playerId })
        .andWhere('redemption."redeemedAt" >= :weekStart', { weekStart })
        .andWhere('redemption."redeemedAt" < :weekEnd', { weekEnd })
        .andWhere('redemption.status != :cancelled', { cancelled: RedemptionStatus.CANCELLED })
        .getRawOne<{ points: string }>(),
    ]);

    const weeklyEarnedPoints = Number(earnedRow?.points ?? 0);
    const weeklySpentPoints = Number(spentRow?.points ?? 0);
    const weeklyAvailablePoints = Math.max(weeklyEarnedPoints - weeklySpentPoints, 0);

    return {
      weeklyEarnedPoints,
      weeklySpentPoints,
      weeklyAvailablePoints,
      totalPoints,
      weekStartUtc: weekStart.toISOString(),
      weekEndUtc: weekEnd.toISOString(),
    };
  }

  private async getWeeklyUsedStockByRewardIds(
    rewardIds: string[],
    weekStart: Date,
    weekEnd: Date,
    manager?: EntityManager,
  ): Promise<Map<string, number>> {
    if (rewardIds.length === 0) {
      return new Map<string, number>();
    }

    const redemptionRepo = manager
      ? manager.getRepository(RewardRedemption)
      : this.redemptionRepo;

    const rows = await redemptionRepo
      .createQueryBuilder('redemption')
      .select('redemption."rewardId"', 'rewardId')
      .addSelect('COUNT(*)', 'usedCount')
      .where('redemption."rewardId" IN (:...rewardIds)', { rewardIds })
      .andWhere('redemption."redeemedAt" >= :weekStart', { weekStart })
      .andWhere('redemption."redeemedAt" < :weekEnd', { weekEnd })
      .andWhere('redemption.status != :cancelled', { cancelled: RedemptionStatus.CANCELLED })
      .groupBy('redemption."rewardId"')
      .getRawMany<{ rewardId: string; usedCount: string }>();

    return new Map(rows.map((row) => [row.rewardId, Number(row.usedCount)]));
  }

}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { envConfig } from '../config/env.config';
import { RewardsService } from './rewards.service';
import { CreateRewardDto, DeliverRedemptionDto, UpdateRewardDto } from './dto/reward.dto';
import { RedemptionStatus } from './reward-redemption.entity';

@Controller()
@UseGuards(JwtAuthGuard)
@ApiTags('Rewards')
@ApiCookieAuth(envConfig.auth.cookieName)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  // --- Player routes ---

  @Get('rewards')
  @ApiOperation({ summary: 'Listar recompensas activas (jugador)' })
  listActiveRewards(@CurrentUser('id') playerId: string) {
    return this.rewardsService.listActiveRewards(playerId);
  }

  @Get('rewards/balance')
  @ApiOperation({ summary: 'Obtener saldo semanal disponible y puntos totales (jugador)' })
  getPlayerBalance(@CurrentUser('id') playerId: string) {
    return this.rewardsService.getPlayerPointsBalance(playerId);
  }

  @Post('rewards/:id/redeem')
  @ApiOperation({ summary: 'Canjear una recompensa (jugador)' })
  redeemReward(
    @CurrentUser('id') playerId: string,
    @Param('id', ParseUUIDPipe) rewardId: string,
  ) {
    return this.rewardsService.redeemReward(playerId, rewardId);
  }

  @Get('rewards/my-redemptions')
  @ApiOperation({ summary: 'Historial de canjes del jugador' })
  getMyRedemptions(@CurrentUser('id') playerId: string) {
    return this.rewardsService.getPlayerRedemptions(playerId);
  }

  // --- Coach routes ---

  @Get('coach/rewards')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({ summary: 'Listar recompensas creadas por el coach' })
  getCoachRewards(@CurrentUser('id') coachId: string) {
    return this.rewardsService.getCoachRewards(coachId);
  }

  @Post('coach/rewards')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({ summary: 'Crear recompensa (coach)' })
  createReward(@CurrentUser('id') coachId: string, @Body() dto: CreateRewardDto) {
    return this.rewardsService.createReward(coachId, dto);
  }

  @Patch('coach/rewards/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({ summary: 'Editar recompensa (coach)' })
  updateReward(
    @CurrentUser('id') coachId: string,
    @Param('id', ParseUUIDPipe) rewardId: string,
    @Body() dto: UpdateRewardDto,
  ) {
    return this.rewardsService.updateReward(coachId, rewardId, dto);
  }

  @Delete('coach/rewards/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({ summary: 'Desactivar recompensa (coach)' })
  deactivateReward(
    @CurrentUser('id') coachId: string,
    @Param('id', ParseUUIDPipe) rewardId: string,
  ) {
    return this.rewardsService.deactivateReward(coachId, rewardId);
  }

  @Get('coach/rewards/redemptions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({ summary: 'Ver canjes de las recompensas del coach' })
  @ApiQuery({ name: 'status', enum: RedemptionStatus, required: false })
  getCoachRedemptions(
    @CurrentUser('id') coachId: string,
    @Query('status') status?: RedemptionStatus,
  ) {
    return this.rewardsService.getCoachRedemptions(coachId, status);
  }

  @Patch('coach/rewards/redemptions/:id/deliver')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({ summary: 'Marcar canje como entregado (coach)' })
  deliverRedemption(
    @CurrentUser('id') coachId: string,
    @Param('id', ParseUUIDPipe) redemptionId: string,
    @Body() dto: DeliverRedemptionDto,
  ) {
    return this.rewardsService.deliverRedemption(coachId, redemptionId, dto);
  }

  @Patch('coach/rewards/redemptions/:id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({ summary: 'Cancelar canje (coach)' })
  cancelRedemption(
    @CurrentUser('id') coachId: string,
    @Param('id', ParseUUIDPipe) redemptionId: string,
  ) {
    return this.rewardsService.cancelRedemption(coachId, redemptionId);
  }
}

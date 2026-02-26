import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrainingService } from './training.service';
import {
  CompleteTrainingGameDto,
  DefenseScenarioCheckDto,
  RoleDefenseCheckDto,
  RoleReceptionCheckDto,
  RotationRoundCheckDto,
} from './dto/training.dto';
import { envConfig } from '../config/env.config';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('training')
@UseGuards(JwtAuthGuard)
@ApiTags('Training')
@ApiCookieAuth(envConfig.auth.cookieName)
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Post('rotation/check')
  @ApiOperation({ summary: 'Validar colocación de rotación completa (6 jugadores)' })
  checkRotationRound(@Body() dto: RotationRoundCheckDto) {
    return this.trainingService.checkRotationRound(dto);
  }

  @Post('defense-zone/check')
  @ApiOperation({ summary: 'Validar defensa por zona de ataque rival' })
  checkDefenseZone(@Body() dto: DefenseScenarioCheckDto) {
    return this.trainingService.checkDefenseScenario(dto);
  }

  @Post('role-reception/check')
  @ApiOperation({ summary: 'Validar posición individual de recepción por rol' })
  checkRoleReception(@Body() dto: RoleReceptionCheckDto) {
    return this.trainingService.checkRoleReception(dto);
  }

  @Post('role-defense/check')
  @ApiOperation({ summary: 'Validar posición individual de defensa por rol' })
  checkRoleDefense(@Body() dto: RoleDefenseCheckDto) {
    return this.trainingService.checkRoleDefense(dto);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Registrar puntuacion final de un minijuego de entrenamiento' })
  completeTrainingGame(
    @CurrentUser('id') userId: string,
    @Body() dto: CompleteTrainingGameDto,
  ) {
    return this.trainingService.completeTrainingGame(userId, dto);
  }
}

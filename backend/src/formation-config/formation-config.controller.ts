import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { UserRole } from '../users/user.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { envConfig } from '../config/env.config';
import { FormationConfigService } from './formation-config.service';
import { SaveRotationZonesDto } from './dto/formation-config.dto';

@ApiTags('Formation Config')
@ApiCookieAuth(envConfig.auth.cookieName)
@Controller()
export class FormationConfigController {
  constructor(private readonly formationConfigService: FormationConfigService) {}

  @Get('coach/formation-config/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({ summary: 'Obtener status de configuracion de todos los juegos' })
  getAllStatus() {
    return this.formationConfigService.getAllConfigStatus();
  }

  @Get('coach/formation-config/:family/:system/:idx')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({ summary: 'Obtener zonas de una rotacion/escenario' })
  getRotationZones(
    @Param('family') family: string,
    @Param('system') system: string,
    @Param('idx', ParseIntPipe) idx: number,
  ) {
    const resolvedSystem = system === 'null' ? null : system;
    return this.formationConfigService.getZonesForRotation(family, resolvedSystem, idx);
  }

  @Put('coach/formation-config/:family/:system/:idx')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COACH)
  @ApiOperation({ summary: 'Guardar zonas de una rotacion/escenario' })
  saveRotationZones(
    @Param('family') family: string,
    @Param('system') system: string,
    @Param('idx', ParseIntPipe) idx: number,
    @Body() dto: SaveRotationZonesDto,
    @CurrentUser('id') coachId: string,
  ) {
    const resolvedSystem = system === 'null' ? null : system;
    return this.formationConfigService.saveZonesForRotation(coachId, family, resolvedSystem, idx, dto.zones);
  }

  @Get('training/formation-status/:gameKey')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verificar si un juego esta configurado (para jugadores)' })
  getGameStatus(@Param('gameKey') gameKey: string) {
    const block = this.formationConfigService.resolveGameBlock(gameKey);
    if (!block) {
      return { configured: false, configuredCount: 0, totalCount: 0 };
    }
    return this.formationConfigService.isGameConfigured(block.gameFamily, block.system);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RankingsService } from './rankings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { envConfig } from '../config/env.config';
import { RankingMode } from './rankings.types';

@Controller('rankings')
@UseGuards(JwtAuthGuard)
@ApiTags('Rankings')
@ApiCookieAuth(envConfig.auth.cookieName)
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener ranking de jugadores (semanal o global)' })
  @ApiQuery({
    name: 'mode',
    enum: ['weekly', 'global'],
    required: false,
    description: 'weekly = puntos de la semana actual, global = puntos historicos',
  })
  getGlobalRanking(@Query('mode') mode?: RankingMode) {
    return this.rankingsService.getGlobalRanking(this.normalizeMode(mode));
  }

  @Get('my-position')
  @ApiOperation({ summary: 'Obtener posicion del usuario actual en ranking semanal o global' })
  @ApiQuery({
    name: 'mode',
    enum: ['weekly', 'global'],
    required: false,
    description: 'weekly = puntos de la semana actual, global = puntos historicos',
  })
  getMyPosition(@CurrentUser('id') userId: string, @Query('mode') mode?: RankingMode) {
    return this.rankingsService.getPlayerPosition(userId, this.normalizeMode(mode));
  }

  private normalizeMode(mode?: RankingMode): RankingMode {
    return mode === 'global' ? 'global' : 'weekly';
  }
}

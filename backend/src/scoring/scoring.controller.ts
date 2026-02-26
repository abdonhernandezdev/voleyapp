import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { envConfig } from '../config/env.config';
import { ScoringService } from './scoring.service';

@Controller('scoring')
@UseGuards(JwtAuthGuard)
@ApiTags('Scoring')
@ApiCookieAuth(envConfig.auth.cookieName)
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Get('my-daily-status')
  @ApiOperation({ summary: 'Estado diario de puntuacion por juego para el usuario actual' })
  getMyDailyStatus(@CurrentUser('id') userId: string) {
    return this.scoringService.getUserDailyStatus(userId);
  }
}


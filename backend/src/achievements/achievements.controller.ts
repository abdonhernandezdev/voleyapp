import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { envConfig } from '../config/env.config';
import { AchievementsService } from './services/achievements.service';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
@ApiTags('Achievements')
@ApiCookieAuth(envConfig.auth.cookieName)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Catalogo de logros disponibles' })
  getCatalog() {
    return this.achievementsService.getCatalog();
  }

  @Get('me')
  @ApiOperation({ summary: 'Estado de logros del usuario autenticado' })
  getMine(@CurrentUser('id') userId: string) {
    return this.achievementsService.getUserProgress(userId);
  }
}

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { envConfig } from '../config/env.config';
import { CoachService } from './services/coach.service';

@Controller('assignments')
@UseGuards(JwtAuthGuard)
@ApiTags('Assignments')
@ApiCookieAuth(envConfig.auth.cookieName)
export class PlayerAssignmentsController {
  constructor(private readonly coachService: CoachService) {}

  @Get('my')
  @ApiOperation({ summary: 'Listar asignaciones activas del jugador actual' })
  getMyAssignments(@CurrentUser('id') userId: string) {
    return this.coachService.getAssignmentsForPlayer(userId);
  }
}

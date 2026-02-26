import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { envConfig } from '../config/env.config';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.COACH)
@ApiTags('Notifications')
@ApiCookieAuth(envConfig.auth.cookieName)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('streak/candidates')
  @ApiOperation({
    summary: 'Listar jugadores candidatos a recordatorio de racha (solo entrenador)',
  })
  getStreakCandidates() {
    return this.notificationsService.getStreakReminderCandidates();
  }

  @Post('streak/send-now')
  @ApiOperation({
    summary: 'Enviar recordatorios de racha manualmente (solo entrenador)',
  })
  dispatchStreakReminders() {
    return this.notificationsService.dispatchStreakReminders();
  }
}

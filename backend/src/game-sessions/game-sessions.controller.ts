import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GameSessionsService } from './game-sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StartSessionDto, SubmitAnswerDto, CompleteSessionDto } from './dto/game-session.dto';
import { GetMySessionsQueryDto } from './dto/get-my-sessions-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { envConfig } from '../config/env.config';

@Controller('game-sessions')
@UseGuards(JwtAuthGuard)
@ApiTags('Game Sessions')
@ApiCookieAuth(envConfig.auth.cookieName)
export class GameSessionsController {
  constructor(private readonly gameSessionsService: GameSessionsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Iniciar una sesión de juego con preguntas aleatorias' })
  start(@CurrentUser('id') userId: string, @Body() dto: StartSessionDto) {
    return this.gameSessionsService.startSession(userId, dto);
  }

  @Post(':id/answer')
  @ApiOperation({ summary: 'Enviar respuesta de una pregunta de la sesión' })
  submitAnswer(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.gameSessionsService.submitAnswer(userId, id, dto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Completar sesión y consolidar puntos/estadísticas' })
  complete(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteSessionDto,
  ) {
    return this.gameSessionsService.completeSession(userId, id, dto);
  }

  @Get('my-sessions')
  @ApiOperation({ summary: 'Listar últimas sesiones completadas del usuario actual' })
  getMySessions(@CurrentUser('id') userId: string, @Query() query: GetMySessionsQueryDto) {
    return this.gameSessionsService.getUserSessions(userId, query.limit);
  }

  @Get('my-stats')
  @ApiOperation({ summary: 'Obtener estadísticas agregadas del usuario actual' })
  getMyStats(@CurrentUser('id') userId: string) {
    return this.gameSessionsService.getUserStats(userId);
  }
}

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
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { envConfig } from '../config/env.config';
import { CoachService } from './services/coach.service';
import {
  CoachQuestionQueryDto,
  CreateCoachQuestionDto,
  UpdateCoachQuestionDto,
} from './dto/coach-question.dto';
import {
  CoachAnalyticsQueryDto,
  CreateCoachAssignmentDto,
  UpdateCoachAssignmentDto,
} from './dto/coach-assignment.dto';

@Controller('coach')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.COACH)
@ApiTags('Coach')
@ApiCookieAuth(envConfig.auth.cookieName)
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get('players')
  @ApiOperation({ summary: 'Listar jugadores para panel de entrenador' })
  getPlayers() {
    return this.coachService.getPlayers();
  }

  @Get('questions')
  @ApiOperation({ summary: 'Listar preguntas del entrenador (sistema + personalizadas)' })
  getQuestions(
    @CurrentUser('id') coachId: string,
    @Query() query: CoachQuestionQueryDto,
  ) {
    return this.coachService.getQuestionsForCoach(coachId, query.includeInactive ?? false);
  }

  @Post('questions')
  @ApiOperation({ summary: 'Crear pregunta personalizada del entrenador' })
  createQuestion(
    @CurrentUser('id') coachId: string,
    @Body() dto: CreateCoachQuestionDto,
  ) {
    return this.coachService.createQuestionForCoach(coachId, dto);
  }

  @Patch('questions/:id')
  @ApiOperation({ summary: 'Actualizar pregunta personalizada del entrenador' })
  updateQuestion(
    @CurrentUser('id') coachId: string,
    @Param('id', ParseUUIDPipe) questionId: string,
    @Body() dto: UpdateCoachQuestionDto,
  ) {
    return this.coachService.updateQuestionForCoach(coachId, questionId, dto);
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Desactivar pregunta personalizada del entrenador' })
  deactivateQuestion(
    @CurrentUser('id') coachId: string,
    @Param('id', ParseUUIDPipe) questionId: string,
  ) {
    return this.coachService.deactivateQuestionForCoach(coachId, questionId);
  }

  @Delete('questions/:id/permanent')
  @ApiOperation({ summary: 'Eliminar permanentemente pregunta personalizada del entrenador' })
  deleteQuestion(
    @CurrentUser('id') coachId: string,
    @Param('id', ParseUUIDPipe) questionId: string,
  ) {
    return this.coachService.deleteQuestionForCoach(coachId, questionId);
  }

  @Get('assignments')
  @ApiOperation({ summary: 'Listar asignaciones del entrenador con progreso' })
  getAssignments(@CurrentUser('id') coachId: string) {
    return this.coachService.getAssignmentsForCoach(coachId);
  }

  @Post('assignments')
  @ApiOperation({ summary: 'Crear asignación de entrenamiento' })
  createAssignment(
    @CurrentUser('id') coachId: string,
    @Body() dto: CreateCoachAssignmentDto,
  ) {
    return this.coachService.createAssignment(coachId, dto);
  }

  @Patch('assignments/:id')
  @ApiOperation({ summary: 'Actualizar asignación de entrenamiento' })
  updateAssignment(
    @CurrentUser('id') coachId: string,
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Body() dto: UpdateCoachAssignmentDto,
  ) {
    return this.coachService.updateAssignment(coachId, assignmentId, dto);
  }

  @Delete('assignments/:id')
  @ApiOperation({ summary: 'Desactivar asignación de entrenamiento' })
  deactivateAssignment(
    @CurrentUser('id') coachId: string,
    @Param('id', ParseUUIDPipe) assignmentId: string,
  ) {
    return this.coachService.deactivateAssignment(coachId, assignmentId);
  }

  @Get('assignments/:id/progress')
  @ApiOperation({ summary: 'Ver detalle de progreso de una asignación' })
  getAssignmentProgress(
    @CurrentUser('id') coachId: string,
    @Param('id', ParseUUIDPipe) assignmentId: string,
  ) {
    return this.coachService.getAssignmentProgressForCoach(coachId, assignmentId);
  }

  @Get('players/:id/analytics')
  @ApiOperation({ summary: 'Obtener analítica detallada por jugador' })
  getPlayerAnalytics(
    @CurrentUser('id') coachId: string,
    @Param('id', ParseUUIDPipe) playerId: string,
    @Query() query: CoachAnalyticsQueryDto,
  ) {
    return this.coachService.getPlayerAnalytics(coachId, playerId, query);
  }

  @Get('players/:id/report')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: 'Exportar informe PDF por jugador' })
  async exportPlayerReport(
    @CurrentUser('id') coachId: string,
    @Param('id', ParseUUIDPipe) playerId: string,
    @Res() res: Response,
  ): Promise<void> {
    const report = await this.coachService.exportPlayerReportPdf(coachId, playerId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
    res.send(report.buffer);
  }
}

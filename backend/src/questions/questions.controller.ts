import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  GetQuestionsQueryDto,
  GetRandomQuestionsQueryDto,
} from './dto/questions-query.dto';
import { envConfig } from '../config/env.config';

@Controller('questions')
@UseGuards(JwtAuthGuard)
@ApiTags('Questions')
@ApiCookieAuth(envConfig.auth.cookieName)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar preguntas activas (sin respuestas correctas)' })
  findAll(@Query() query: GetQuestionsQueryDto) {
    return this.questionsService.findAllPublic(query.category, query.type);
  }

  @Get('random')
  @ApiOperation({ summary: 'Obtener preguntas aleatorias para jugar' })
  getRandom(@Query() query: GetRandomQuestionsQueryDto) {
    return this.questionsService.getRandomQuestionsPublic(query.category, query.limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Ver estadísticas de uso por categoría de preguntas' })
  getStats() {
    return this.questionsService.getStats();
  }
}

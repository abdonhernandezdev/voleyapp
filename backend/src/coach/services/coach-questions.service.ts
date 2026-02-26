import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question, QuestionType } from '../../questions/question.entity';
import { CoachQuestionItem } from '../coach.types';
import { CreateCoachQuestionDto, UpdateCoachQuestionDto } from '../dto/coach-question.dto';

@Injectable()
export class CoachQuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
  ) {}

  async getQuestionsForCoach(coachId: string, includeInactive = false): Promise<CoachQuestionItem[]> {
    const qb = this.questionRepo
      .createQueryBuilder('q')
      .where('(q."isCustom" = false OR q."createdByCoachId" = :coachId)', { coachId });

    if (!includeInactive) {
      qb.andWhere('q."isActive" = true');
    }

    const rows = await qb.orderBy('q.createdAt', 'DESC').getMany();
    return rows.map((question) => this.toCoachQuestion(question));
  }

  async createQuestionForCoach(
    coachId: string,
    dto: CreateCoachQuestionDto,
  ): Promise<CoachQuestionItem> {
    this.validateCoachQuestionPayload(dto.type, dto.options, dto.correctOptionIndex);

    const created = this.questionRepo.create({
      type: dto.type,
      category: dto.category,
      difficulty: dto.difficulty,
      question: dto.question,
      explanation: dto.explanation ?? null,
      options: dto.type === QuestionType.QUIZ ? (dto.options ?? []) : null,
      correctOptionIndex:
        dto.type === QuestionType.QUIZ ? (dto.correctOptionIndex ?? null) : null,
      isActive: true,
      isCustom: true,
      createdByCoachId: coachId,
      fieldConfig: null,
      rotationConfig: null,
      timesAnswered: 0,
      timesCorrect: 0,
    });

    const saved = await this.questionRepo.save(created);
    return this.toCoachQuestion(saved);
  }

  async updateQuestionForCoach(
    coachId: string,
    questionId: string,
    dto: UpdateCoachQuestionDto,
  ): Promise<CoachQuestionItem> {
    const question = await this.questionRepo.findOne({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Pregunta no encontrada');

    if (!question.isCustom || question.createdByCoachId !== coachId) {
      throw new ForbiddenException('Solo puedes editar preguntas personalizadas creadas por ti');
    }

    const options = dto.options ?? question.options ?? undefined;
    const correctOptionIndex =
      dto.correctOptionIndex !== undefined
        ? dto.correctOptionIndex
        : question.correctOptionIndex ?? undefined;
    this.validateCoachQuestionPayload(question.type, options, correctOptionIndex);

    Object.assign(question, {
      category: dto.category ?? question.category,
      difficulty: dto.difficulty ?? question.difficulty,
      question: dto.question ?? question.question,
      explanation:
        dto.explanation !== undefined ? dto.explanation : question.explanation,
      options: question.type === QuestionType.QUIZ ? (options ?? null) : question.options,
      correctOptionIndex:
        question.type === QuestionType.QUIZ
          ? (correctOptionIndex ?? null)
          : question.correctOptionIndex,
      isActive: dto.isActive ?? question.isActive,
    });

    const saved = await this.questionRepo.save(question);
    return this.toCoachQuestion(saved);
  }

  async deactivateQuestionForCoach(coachId: string, questionId: string): Promise<{ ok: true }> {
    const question = await this.questionRepo.findOne({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Pregunta no encontrada');

    if (!question.isCustom || question.createdByCoachId !== coachId) {
      throw new ForbiddenException('Solo puedes desactivar tus preguntas personalizadas');
    }

    question.isActive = false;
    await this.questionRepo.save(question);
    return { ok: true };
  }

  async deleteQuestionForCoach(coachId: string, questionId: string): Promise<{ ok: true }> {
    const question = await this.questionRepo.findOne({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Pregunta no encontrada');

    if (!question.isCustom || question.createdByCoachId !== coachId) {
      throw new ForbiddenException('Solo puedes eliminar tus preguntas personalizadas');
    }

    await this.questionRepo.remove(question);
    return { ok: true };
  }

  private validateCoachQuestionPayload(
    type: QuestionType,
    options?: string[] | null,
    correctOptionIndex?: number | null,
  ): void {
    if (type !== QuestionType.QUIZ) {
      throw new BadRequestException('Actualmente solo se permite crear preguntas tipo quiz');
    }

    if (!options || options.length !== 4) {
      throw new BadRequestException('Una pregunta quiz debe tener exactamente 4 opciones');
    }

    const hasInvalidOption = options.some((option) => !option || option.trim().length === 0);
    if (hasInvalidOption) {
      throw new BadRequestException('Todas las opciones deben tener texto');
    }

    if (correctOptionIndex === undefined || correctOptionIndex === null) {
      throw new BadRequestException('correctOptionIndex es obligatorio para preguntas quiz');
    }

    if (correctOptionIndex < 0 || correctOptionIndex > 3) {
      throw new BadRequestException('correctOptionIndex debe estar entre 0 y 3');
    }
  }

  private toCoachQuestion(question: Question): CoachQuestionItem {
    const accuracy =
      question.timesAnswered > 0
        ? Math.round((question.timesCorrect / question.timesAnswered) * 100)
        : 0;

    return {
      id: question.id,
      type: question.type,
      category: question.category,
      difficulty: question.difficulty,
      question: question.question,
      explanation: question.explanation ?? null,
      options: question.options ?? null,
      correctOptionIndex: question.correctOptionIndex ?? null,
      isActive: question.isActive,
      isCustom: question.isCustom,
      createdByCoachId: question.createdByCoachId,
      timesAnswered: question.timesAnswered,
      timesCorrect: question.timesCorrect,
      accuracy,
      createdAt: question.createdAt,
    };
  }
}

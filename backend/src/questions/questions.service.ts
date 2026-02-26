import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question, QuestionCategory, QuestionType } from './question.entity';
import { PublicQuestion } from './question-public.types';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
  ) {}

  async findAll(category?: QuestionCategory, type?: QuestionType): Promise<Question[]> {
    const query = this.questionRepo.createQueryBuilder('q').where('q.isActive = true');
    if (category) query.andWhere('q.category = :category', { category });
    if (type) query.andWhere('q.type = :type', { type });
    return query.orderBy('q.difficulty', 'ASC').getMany();
  }

  async getRandomQuestions(
    category?: QuestionCategory,
    limit = 10,
    type?: QuestionType,
  ): Promise<Question[]> {
    const query = this.questionRepo.createQueryBuilder('q').where('q.isActive = true');
    if (category) query.andWhere('q.category = :category', { category });
    if (type) query.andWhere('q.type = :type', { type });
    query.orderBy('RANDOM()').take(limit);
    return query.getMany();
  }

  async findById(id: string): Promise<Question | null> {
    return this.questionRepo.findOne({ where: { id } });
  }

  async recordAnswer(id: string, correct: boolean): Promise<void> {
    await this.questionRepo.increment({ id }, 'timesAnswered', 1);
    if (correct) {
      await this.questionRepo.increment({ id }, 'timesCorrect', 1);
    }
  }

  async getStats() {
    // Una sola query con GROUP BY en lugar de una query por cada categoría
    const rows: Array<{
      category: string;
      total: string;
      answered: string;
      correct: string;
    }> = await this.questionRepo
      .createQueryBuilder('q')
      .select('q.category', 'category')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(q.timesAnswered)', 'answered')
      .addSelect('SUM(q.timesCorrect)', 'correct')
      .where('q.isActive = true')
      .groupBy('q.category')
      .getRawMany();

    const stats: Record<string, { total: number; answered: number; correct: number }> = {};
    for (const cat of Object.values(QuestionCategory)) {
      const row = rows.find((r) => r.category === cat);
      stats[cat] = {
        total: row ? Number(row.total) : 0,
        answered: row ? Number(row.answered) : 0,
        correct: row ? Number(row.correct) : 0,
      };
    }
    return stats;
  }

  toPublicQuestion(question: Question): PublicQuestion {
    return {
      id: question.id,
      type: question.type,
      category: question.category,
      difficulty: question.difficulty,
      question: question.question,
      explanation: question.explanation ?? null,
      options: question.options ?? null,
      fieldConfig: question.fieldConfig
        ? {
            positions: question.fieldConfig.positions,
            players: question.fieldConfig.players,
          }
        : null,
      rotationConfig: question.rotationConfig
        ? {
            rotationNumber: question.rotationConfig.rotationNumber,
            phase: question.rotationConfig.phase,
            playerPositions: question.rotationConfig.playerPositions,
            targetRole: question.rotationConfig.targetRole,
          }
        : null,
    };
  }

  toPublicQuestions(questions: Question[]): PublicQuestion[] {
    return questions.map((question) => this.toPublicQuestion(question));
  }

  async findAllPublic(category?: QuestionCategory, type?: QuestionType): Promise<PublicQuestion[]> {
    const questions = await this.findAll(category, type);
    return this.toPublicQuestions(questions);
  }

  async getRandomQuestionsPublic(
    category?: QuestionCategory,
    limit = 10,
    type?: QuestionType,
  ): Promise<PublicQuestion[]> {
    const questions = await this.getRandomQuestions(category, limit, type);
    return this.toPublicQuestions(questions);
  }
}

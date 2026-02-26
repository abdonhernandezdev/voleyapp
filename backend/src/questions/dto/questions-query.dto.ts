import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { QuestionCategory, QuestionType } from '../question.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetQuestionsQueryDto {
  @ApiPropertyOptional({ enum: QuestionCategory, example: QuestionCategory.BASIC_RULES })
  @IsOptional()
  @IsEnum(QuestionCategory)
  category?: QuestionCategory;

  @ApiPropertyOptional({ enum: QuestionType, example: QuestionType.QUIZ })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;
}

export class GetRandomQuestionsQueryDto {
  @ApiPropertyOptional({ enum: QuestionCategory, example: QuestionCategory.GAME_SYSTEMS })
  @IsOptional()
  @IsEnum(QuestionCategory)
  category?: QuestionCategory;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 30, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit = 10;
}

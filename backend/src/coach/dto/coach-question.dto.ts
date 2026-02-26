import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Difficulty, QuestionCategory, QuestionType } from '../../questions/question.entity';

export class CreateCoachQuestionDto {
  @ApiProperty({ enum: QuestionType, example: QuestionType.QUIZ })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ enum: QuestionCategory, example: QuestionCategory.GAME_SYSTEMS })
  @IsEnum(QuestionCategory)
  category: QuestionCategory;

  @ApiProperty({ enum: Difficulty, example: Difficulty.MEDIUM })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiProperty({ example: '¿Quién debe cubrir zona 6 en defensa base infantil?' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(400)
  question: string;

  @ApiPropertyOptional({ example: 'El receptor trasero cubre diagonal larga desde zona 6.' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(600)
  explanation?: string;

  @ApiPropertyOptional({ type: [String], example: ['Colocador', 'Receptor trasero', 'Central trasero', 'Opuesto'] })
  @ValidateIf((dto: CreateCoachQuestionDto) => dto.type === QuestionType.QUIZ)
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 1, minimum: 0, maximum: 10 })
  @ValidateIf((dto: CreateCoachQuestionDto) => dto.type === QuestionType.QUIZ)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  correctOptionIndex?: number;
}

export class UpdateCoachQuestionDto {
  @ApiPropertyOptional({ enum: QuestionCategory, example: QuestionCategory.GAME_SYSTEMS })
  @IsOptional()
  @IsEnum(QuestionCategory)
  category?: QuestionCategory;

  @ApiPropertyOptional({ enum: Difficulty, example: Difficulty.MEDIUM })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({ example: 'Nueva redacción de la pregunta' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(400)
  question?: string;

  @ApiPropertyOptional({ example: 'Nueva explicación táctica.' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(600)
  explanation?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  correctOptionIndex?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class CoachQuestionQueryDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeInactive?: boolean;
}

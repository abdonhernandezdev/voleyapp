import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GameMode } from '../game-session.entity';
import { QuestionCategory } from '../../questions/question.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiProperty({ enum: GameMode, example: GameMode.QUICK })
  @IsEnum(GameMode)
  mode: GameMode;

  @ApiPropertyOptional({ enum: QuestionCategory, example: QuestionCategory.BASIC_RULES })
  @IsOptional()
  @IsEnum(QuestionCategory)
  category?: QuestionCategory;
}

export class AnswerDto {
  @ApiProperty({ example: 1, minimum: -1, maximum: 10 })
  @IsInt()
  @Min(-1)
  @Max(10)
  selectedOptionIndex: number;

  @ApiProperty({ example: 8, minimum: 0, maximum: 300 })
  @IsInt()
  @Min(0)
  @Max(300)
  timeSeconds: number;
}

export class SubmitAnswerDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  questionId: string;

  @ApiProperty({ type: AnswerDto })
  @ValidateNested()
  @Type(() => AnswerDto)
  answer: AnswerDto;
}

export class CompleteSessionDto {
  @ApiProperty({ example: 120, minimum: 0 })
  @IsInt()
  @Min(0)
  totalTimeSpentSeconds: number;
}

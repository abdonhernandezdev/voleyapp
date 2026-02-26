import { Type } from 'class-transformer';
import {
  IsDateString,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameMode } from '../../game-sessions/game-session.entity';
import { QuestionCategory } from '../../questions/question.entity';
import { AssignmentTargetType } from '../coach-assignment.entity';

export class CreateCoachAssignmentDto {
  @ApiProperty({ example: 'Sesión de defensa por zona', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ example: 'Completar 1 sesión de quiz categoría sistemas antes del viernes.' })
  @IsOptional()
  @IsString()
  @MaxLength(700)
  description?: string;

  @ApiProperty({ enum: GameMode, example: GameMode.QUICK })
  @IsEnum(GameMode)
  mode: GameMode;

  @ApiPropertyOptional({ enum: QuestionCategory, example: QuestionCategory.GAME_SYSTEMS })
  @IsOptional()
  @IsEnum(QuestionCategory)
  category?: QuestionCategory;

  @ApiProperty({ enum: AssignmentTargetType, example: AssignmentTargetType.ALL_PLAYERS })
  @IsEnum(AssignmentTargetType)
  targetType: AssignmentTargetType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  targetUserId?: string;

  @ApiPropertyOptional({ example: '2026-03-15', description: 'Fecha límite en formato YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateCoachAssignmentDto {
  @ApiPropertyOptional({ example: 'Sesión actualizada', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ example: 'Nueva indicación del entrenador.' })
  @IsOptional()
  @IsString()
  @MaxLength(700)
  description?: string;

  @ApiPropertyOptional({ enum: GameMode })
  @IsOptional()
  @IsEnum(GameMode)
  mode?: GameMode;

  @ApiPropertyOptional({ enum: QuestionCategory })
  @IsOptional()
  @IsEnum(QuestionCategory)
  category?: QuestionCategory | null;

  @ApiPropertyOptional({ enum: AssignmentTargetType })
  @IsOptional()
  @IsEnum(AssignmentTargetType)
  targetType?: AssignmentTargetType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  targetUserId?: string | null;

  @ApiPropertyOptional({ example: '2026-03-15' })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class CoachAnalyticsQueryDto {
  @ApiPropertyOptional({ example: 8, minimum: 2, maximum: 26, default: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  weeks = 8;
}

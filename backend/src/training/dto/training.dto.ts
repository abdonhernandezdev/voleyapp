import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ScoringGame } from '../../scoring/scoring.constants';
import { ReceptionSystem } from '../training.constants';

export class PointDto {
  @ApiProperty({ example: 52.5, minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  x: number;

  @ApiProperty({ example: 68.2, minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  y: number;
}

export class PlacementDto extends PointDto {
  @ApiProperty({ example: 3, minimum: 1, maximum: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  playerId: number;
}

export class RotationRoundCheckDto {
  @ApiProperty({ example: 1, minimum: 1, maximum: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  rotation: number;

  @ApiProperty({ example: 27, minimum: 0, maximum: 600 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(600)
  elapsedSeconds: number;

  @ApiProperty({ type: [PlacementDto] })
  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => PlacementDto)
  placements: PlacementDto[];

  @ApiProperty({ enum: ['5-1', '4-2', '6-2'], required: false })
  @IsOptional()
  @IsIn(['5-1', '4-2', '6-2'])
  system?: ReceptionSystem;
}

export class DefenseScenarioCheckDto {
  @ApiProperty({ example: 2, minimum: 1, maximum: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  scenarioId: number;

  @ApiProperty({ type: [PlacementDto] })
  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => PlacementDto)
  placements: PlacementDto[];
}

export class RoleReceptionCheckDto {
  @ApiProperty({ example: 4, minimum: 1, maximum: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  rotation: number;

  @ApiProperty({ example: 2, minimum: 1, maximum: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  roleId: number;

  @ApiProperty({ example: 15, minimum: 0, maximum: 600 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(600)
  elapsedSeconds: number;

  @ApiProperty({ type: PointDto })
  @ValidateNested()
  @Type(() => PointDto)
  placement: PointDto;
}

export class RoleDefenseCheckDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  roundId: number;

  @ApiProperty({ example: 2, minimum: 1, maximum: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  roleId: number;

  @ApiProperty({ example: 20, minimum: 0, maximum: 600 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(600)
  elapsedSeconds: number;

  @ApiProperty({ type: PointDto })
  @ValidateNested()
  @Type(() => PointDto)
  placement: PointDto;
}

export class CompleteTrainingGameDto {
  @ApiProperty({
    enum: [
      ScoringGame.DEFENSE_ZONE,
      ScoringGame.RECEPTION_5_1,
      ScoringGame.ROLE_RECEPTION,
      ScoringGame.ROLE_DEFENSE,
    ],
    example: ScoringGame.RECEPTION_5_1,
  })
  @IsEnum(ScoringGame)
  game: ScoringGame;

  @ApiProperty({ example: 860, minimum: 0, maximum: 5000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5000)
  rawPoints: number;

  @ApiProperty({ example: 6, minimum: 0, maximum: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  roundsCompleted?: number;

  @ApiProperty({ example: 5, minimum: 0, maximum: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  roundsCorrect?: number;

  @ApiProperty({ example: 'rotation-finished', required: false })
  @IsOptional()
  @IsString()
  source?: string;
}

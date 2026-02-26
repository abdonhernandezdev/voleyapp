import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRewardDto {
  @ApiProperty({ example: 'Partido de pizza', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'Pizza para el equipo tras ganar.', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 500, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pointCost: number;

  @ApiProperty({ example: 10, minimum: 0, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number | null;
}

export class UpdateRewardDto {
  @ApiProperty({ example: 'Nueva camiseta', maxLength: 120, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ example: 300, minimum: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pointCost?: number;

  @ApiProperty({ example: 5, minimum: 0, required: false, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number | null;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DeliverRedemptionDto {
  @ApiProperty({ example: 'Entregado el 24/02', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

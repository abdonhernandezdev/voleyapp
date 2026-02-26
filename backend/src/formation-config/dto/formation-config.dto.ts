import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ZoneDto {
  @IsInt()
  @Min(1)
  @Max(6)
  playerId: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  x: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  y: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  w: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  h: number;
}

export class SaveRotationZonesDto {
  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ZoneDto)
  zones: ZoneDto[];
}

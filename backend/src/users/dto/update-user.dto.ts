import { Transform } from 'class-transformer';
import { IsBoolean, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Abdon' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(40)
  displayName?: string;

  @ApiPropertyOptional({ example: 'sports_volleyball' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(40)
  avatarEmoji?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Habilita recordatorios por email cuando el jugador va a perder su racha',
  })
  @IsOptional()
  @IsBoolean()
  streakReminderEmailEnabled?: boolean;
}

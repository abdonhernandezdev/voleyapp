import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'jugador@club.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secreto123' })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'abdon23' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(24)
  @Matches(/^[a-zA-Z0-9_.-]+$/)
  username: string;

  @ApiProperty({ example: 'abdon@club.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'claveSegura123' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  password: string;

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
    description: 'Activar recordatorios por email para no perder la racha',
  })
  @IsOptional()
  @IsBoolean()
  streakReminderEmailEnabled?: boolean;

}

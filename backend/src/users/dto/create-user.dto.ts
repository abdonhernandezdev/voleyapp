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

export class CreateUserDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(24)
  @Matches(/^[a-zA-Z0-9_.-]+$/)
  username: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  password: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(40)
  displayName?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(40)
  avatarEmoji?: string;

  @IsOptional()
  @IsBoolean()
  streakReminderEmailEnabled?: boolean;
}

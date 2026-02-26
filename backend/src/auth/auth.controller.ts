import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { envConfig } from '../config/env.config';
import { UsersService } from '../users/users.service';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario y establecer cookie JWT' })
  @Throttle({
    default: {
      limit: envConfig.security.rateLimit.authLimit,
      ttl: envConfig.security.rateLimit.authTtlMs,
    },
  })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.authService.register(dto);
    this.setAuthCookie(res, token);
    return { user };
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y establecer cookie JWT' })
  @Throttle({
    default: {
      limit: envConfig.security.rateLimit.authLimit,
      ttl: envConfig.security.rateLimit.authTtlMs,
    },
  })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.authService.login(dto);
    this.setAuthCookie(res, token);
    return { user };
  }

  @Post('logout')
  @ApiCookieAuth(envConfig.auth.cookieName)
  @ApiOperation({ summary: 'Cerrar sesión y limpiar cookie JWT' })
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearAuthCookie(res);
    return { ok: true };
  }

  @Get('me')
  @ApiCookieAuth(envConfig.auth.cookieName)
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado (o null si no hay sesión)' })
  @UseGuards(OptionalJwtAuthGuard)
  getMe(@CurrentUser('id') userId?: string) {
    if (!userId) {
      return null;
    }
    return this.usersService.getProfile(userId);
  }

  private setAuthCookie(res: Response, token: string): void {
    res.cookie(envConfig.auth.cookieName, token, {
      httpOnly: true,
      secure: envConfig.app.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: envConfig.auth.cookieMaxAgeMs,
    });
  }

  private clearAuthCookie(res: Response): void {
    res.clearCookie(envConfig.auth.cookieName, {
      httpOnly: true,
      secure: envConfig.app.isProduction,
      sameSite: 'lax',
      path: '/',
    });
  }
}

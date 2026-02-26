import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UserRole } from '../users/user.entity';
import { envConfig } from '../config/env.config';

const FALLBACK_PASSWORD_HASH = bcrypt.hashSync(
  'fallback-password-not-used-for-real-auth',
  envConfig.auth.bcryptRounds,
);

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    const token = this.generateToken(user.id, user.email, user.role);
    const profile = this.usersService.toPublicProfile(user);
    return { user: profile, token };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    const passwordHash = user?.password ?? FALLBACK_PASSWORD_HASH;
    const valid = await bcrypt.compare(dto.password, passwordHash);
    if (!user || !valid) throw new UnauthorizedException('Credenciales incorrectas');

    const token = this.generateToken(user.id, user.email, user.role);
    const profile = this.usersService.toPublicProfile(user);
    return { user: profile, token };
  }

  private generateToken(id: string, email: string, role: UserRole) {
    return this.jwtService.sign(
      { sub: id, email, role },
      {
        issuer: envConfig.auth.jwtIssuer,
        audience: envConfig.auth.jwtAudience,
      },
    );
  }
}

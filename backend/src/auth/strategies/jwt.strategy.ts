import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { envConfig } from '../../config/env.config';

function cookieExtractor(req: Request | undefined): string | null {
  if (!req?.cookies) return null;
  const value = req.cookies[envConfig.auth.cookieName];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: envConfig.auth.jwtSecret,
      issuer: envConfig.auth.jwtIssuer,
      audience: envConfig.auth.jwtAudience,
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException();
      return { id: user.id, email: user.email, role: user.role };
    } catch {
      throw new UnauthorizedException();
    }
  }
}

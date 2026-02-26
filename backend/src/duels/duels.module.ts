import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DuelsGateway } from './duels.gateway';
import { DuelsService } from './duels.service';
import { QuestionsModule } from '../questions/questions.module';
import { UsersModule } from '../users/users.module';
import { ScoringModule } from '../scoring/scoring.module';
import { envConfig } from '../config/env.config';

@Module({
  imports: [
    QuestionsModule,
    UsersModule,
    ScoringModule,
    JwtModule.register({
      secret: envConfig.auth.jwtSecret,
      signOptions: {
        issuer: envConfig.auth.jwtIssuer,
        audience: envConfig.auth.jwtAudience,
      },
    }),
  ],
  providers: [DuelsGateway, DuelsService],
  exports: [DuelsService],
})
export class DuelsModule {}

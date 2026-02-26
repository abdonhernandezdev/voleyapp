import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RankingsService } from './rankings.service';
import { RankingsController } from './rankings.controller';
import { User } from '../users/user.entity';
import { ScoreEvent } from '../scoring/score-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ScoreEvent])],
  providers: [RankingsService],
  controllers: [RankingsController],
})
export class RankingsModule {}

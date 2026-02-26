import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reward } from './entities/reward.entity';
import { RewardRedemption } from './entities/reward-redemption.entity';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { UsersModule } from '../users/users.module';
import { ScoreEvent } from '../scoring/score-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reward, RewardRedemption, ScoreEvent]), UsersModule],
  providers: [RewardsService],
  controllers: [RewardsController],
  exports: [RewardsService],
})
export class RewardsModule {}

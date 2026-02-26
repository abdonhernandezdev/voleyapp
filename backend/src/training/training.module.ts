import { Module } from '@nestjs/common';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { ScoringModule } from '../scoring/scoring.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { FormationConfigModule } from '../formation-config/formation-config.module';
import { RotationRoundValidator } from './validators/rotation-round.validator';
import { DefenseScenarioValidator } from './validators/defense-scenario.validator';
import { RoleReceptionValidator } from './validators/role-reception.validator';
import { RoleDefenseValidator } from './validators/role-defense.validator';

@Module({
  imports: [ScoringModule, AchievementsModule, FormationConfigModule],
  controllers: [TrainingController],
  providers: [
    TrainingService,
    RotationRoundValidator,
    DefenseScenarioValidator,
    RoleReceptionValidator,
    RoleDefenseValidator,
  ],
})
export class TrainingModule {}

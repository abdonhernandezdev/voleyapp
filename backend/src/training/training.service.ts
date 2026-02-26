import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CompleteTrainingGameDto,
  DefenseScenarioCheckDto,
  RoleDefenseCheckDto,
  RoleReceptionCheckDto,
  RotationRoundCheckDto,
} from './dto/training.dto';
import { ScoringGame } from '../scoring/scoring.constants';
import { ScoringService } from '../scoring/scoring.service';
import { AchievementsService } from '../achievements/achievements.service';
import { RotationRoundValidator } from './validators/rotation-round.validator';
import { DefenseScenarioValidator } from './validators/defense-scenario.validator';
import { RoleReceptionValidator } from './validators/role-reception.validator';
import { RoleDefenseValidator } from './validators/role-defense.validator';

@Injectable()
export class TrainingService {
  constructor(
    private readonly scoringService: ScoringService,
    private readonly achievementsService: AchievementsService,
    private readonly rotationRoundValidator: RotationRoundValidator,
    private readonly defenseScenarioValidator: DefenseScenarioValidator,
    private readonly roleReceptionValidator: RoleReceptionValidator,
    private readonly roleDefenseValidator: RoleDefenseValidator,
  ) {}

  private readonly scoringGames = new Set<ScoringGame>([
    ScoringGame.DEFENSE_ZONE,
    ScoringGame.RECEPTION_5_1,
    ScoringGame.RECEPTION_4_2,
    ScoringGame.RECEPTION_6_2,
    ScoringGame.ROLE_RECEPTION,
    ScoringGame.ROLE_DEFENSE,
  ]);

  checkRotationRound(dto: RotationRoundCheckDto) {
    return this.rotationRoundValidator.validate(dto);
  }

  checkDefenseScenario(dto: DefenseScenarioCheckDto) {
    return this.defenseScenarioValidator.validate(dto);
  }

  checkRoleReception(dto: RoleReceptionCheckDto) {
    return this.roleReceptionValidator.validate(dto);
  }

  checkRoleDefense(dto: RoleDefenseCheckDto) {
    return this.roleDefenseValidator.validate(dto);
  }

  async completeTrainingGame(userId: string, dto: CompleteTrainingGameDto) {
    if (!this.scoringGames.has(dto.game)) {
      throw new BadRequestException('Juego no permitido para entrenamiento');
    }

    const policy = this.scoringService.getPolicy(dto.game);
    const sessionWon = this.resolveSessionWon(dto, policy.winThresholdRawPoints ?? 0);

    const scoring = await this.scoringService.applyGameScore({
      userId,
      game: dto.game,
      rawPoints: dto.rawPoints,
      sessionWon,
      source: dto.source ?? 'training_complete',
      metadata: {
        roundsCompleted: dto.roundsCompleted ?? null,
        roundsCorrect: dto.roundsCorrect ?? null,
      },
    });

    const unlockedAchievements = await this.achievementsService.evaluateAfterTraining(
      scoring.updatedUser,
      dto.game,
    );

    return {
      game: scoring.game,
      gameType: scoring.gameType,
      rawPoints: scoring.rawPoints,
      normalizedPoints: scoring.normalizedPoints,
      awardedPoints: scoring.awardedPoints,
      dailyAwardLimit: scoring.dailyAwardLimit,
      awardedCountToday: scoring.awardedCountToday,
      remainingAwardsToday: scoring.remainingAwardsToday,
      dailyCapApplied: scoring.dailyCapApplied,
      totalPoints: scoring.updatedUser.totalPoints,
      gamesPlayed: scoring.updatedUser.gamesPlayed,
      unlockedAchievements,
    };
  }

  private resolveSessionWon(dto: CompleteTrainingGameDto, fallbackThreshold: number): boolean {
    if (
      typeof dto.roundsCompleted === 'number' &&
      dto.roundsCompleted > 0 &&
      typeof dto.roundsCorrect === 'number'
    ) {
      return dto.roundsCorrect / dto.roundsCompleted >= 0.6;
    }
    return dto.rawPoints >= fallbackThreshold;
  }
}

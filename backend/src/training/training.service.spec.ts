import { BadRequestException } from '@nestjs/common';
import { TrainingService } from './training.service';
import { ROTATIONS, DEFENSE_SCENARIOS, DEFENSE_ROUNDS } from './training.constants';
import { ScoringService } from '../scoring/scoring.service';
import { AchievementsService } from '../achievements/achievements.service';
import { FormationConfigService, ZoneConfig } from '../formation-config/formation-config.service';
import { RotationRoundValidator } from './validators/rotation-round.validator';
import { DefenseScenarioValidator } from './validators/defense-scenario.validator';
import { RoleReceptionValidator } from './validators/role-reception.validator';
import { RoleDefenseValidator } from './validators/role-defense.validator';

function makeZonesFor(players: Array<{ id: number; point: { x: number; y: number } }>): ZoneConfig[] {
  return players.map((p) => ({
    playerId: p.id,
    x: p.point.x - 15,
    y: p.point.y - 15,
    w: 30,
    h: 30,
  }));
}

describe('TrainingService', () => {
  let service: TrainingService;
  let scoringService: jest.Mocked<ScoringService>;
  let achievementsService: jest.Mocked<Pick<AchievementsService, 'evaluateAfterTraining'>>;
  let formationConfigService: jest.Mocked<FormationConfigService>;

  beforeEach(() => {
    scoringService = {
      getPolicy: jest.fn().mockReturnValue({ winThresholdRawPoints: 300 }),
      applyGameScore: jest.fn().mockResolvedValue({
        game: 'reception_5_1',
        gameType: 'general',
        rawPoints: 900,
        normalizedPoints: 378,
        awardedPoints: 378,
        dailyAwardLimit: 2,
        awardedCountToday: 1,
        remainingAwardsToday: 1,
        dailyCapApplied: false,
        updatedUser: { totalPoints: 1000, gamesPlayed: 10 } as any,
      }),
    } as any;
    achievementsService = {
      evaluateAfterTraining: jest.fn().mockResolvedValue([]),
    };
    formationConfigService = {
      getZonesForRotation: jest.fn(),
      getZoneForPlayer: jest.fn(),
      isGameConfigured: jest.fn(),
      getAllConfigStatus: jest.fn(),
      resolveGameBlock: jest.fn(),
      saveZonesForRotation: jest.fn(),
    } as any;

    service = new TrainingService(
      scoringService,
      achievementsService as any,
      new RotationRoundValidator(formationConfigService),
      new DefenseScenarioValidator(formationConfigService),
      new RoleReceptionValidator(formationConfigService),
      new RoleDefenseValidator(formationConfigService),
    );
  });

  // ─── checkRotationRound ───────────────────────────────────────────────────

  describe('checkRotationRound', () => {
    it('should throw BadRequestException for invalid rotation', async () => {
      formationConfigService.getZonesForRotation.mockResolvedValue([]);
      await expect(
        service.checkRotationRound({
          rotation: 99,
          placements: [],
          elapsedSeconds: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when game is not configured', async () => {
      formationConfigService.getZonesForRotation.mockResolvedValue([]);
      const rotation = ROTATIONS[0];
      const placements = rotation.players.map((p) => ({
        playerId: p.id,
        x: p.point.x,
        y: p.point.y,
      }));
      await expect(
        service.checkRotationRound({
          rotation: rotation.rotation,
          placements,
          elapsedSeconds: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return correctCount=6 when all players placed inside their zones', async () => {
      const rotation = ROTATIONS[0];
      const zones = makeZonesFor(rotation.players);
      formationConfigService.getZonesForRotation.mockResolvedValue(zones);

      const placements = rotation.players.map((p) => ({
        playerId: p.id,
        x: p.point.x,
        y: p.point.y,
      }));

      const result = await service.checkRotationRound({
        rotation: rotation.rotation,
        placements,
        elapsedSeconds: 5,
      });

      expect(result.correctCount).toBe(6);
      expect(result.roundPoints).toBeGreaterThan(6 * 30 + 120);
      expect(result.perPlayer).toHaveLength(6);
      result.perPlayer.forEach((p) => expect(p.correct).toBe(true));
    });

    it('should return correctCount < 6 when some players are outside zones', async () => {
      const rotation = ROTATIONS[0];
      const zones = makeZonesFor(rotation.players);
      formationConfigService.getZonesForRotation.mockResolvedValue(zones);

      const placements = rotation.players.map((p, idx) => ({
        playerId: p.id,
        x: idx === 0 ? p.point.x : 200,
        y: idx === 0 ? p.point.y : 200,
      }));

      const result = await service.checkRotationRound({
        rotation: rotation.rotation,
        placements,
        elapsedSeconds: 20,
      });

      expect(result.correctCount).toBeLessThan(6);
      expect(result.roundPoints).toBeLessThan(6 * 30 + 120);
    });
  });

  // ─── checkDefenseScenario ────────────────────────────────────────────────

  describe('checkDefenseScenario', () => {
    it('should throw BadRequestException for invalid scenario', async () => {
      formationConfigService.getZonesForRotation.mockResolvedValue([]);
      await expect(
        service.checkDefenseScenario({
          scenarioId: 999,
          placements: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when game is not configured', async () => {
      formationConfigService.getZonesForRotation.mockResolvedValue([]);
      const scenario = DEFENSE_SCENARIOS[0];
      const playerIds = Object.keys(scenario.targets).map(Number);
      const placements = playerIds.map((id) => ({
        playerId: id,
        x: scenario.targets[id].x,
        y: scenario.targets[id].y,
      }));
      await expect(
        service.checkDefenseScenario({ scenarioId: scenario.id, placements }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should evaluate a valid scenario and return perPlayer results', async () => {
      const scenario = DEFENSE_SCENARIOS[0];
      const playerIds = Object.keys(scenario.targets).map(Number);
      const zones: ZoneConfig[] = playerIds.map((id) => ({
        playerId: id,
        x: scenario.targets[id].x - 15,
        y: scenario.targets[id].y - 15,
        w: 30,
        h: 30,
      }));
      formationConfigService.getZonesForRotation.mockResolvedValue(zones);

      const placements = playerIds.map((id) => ({
        playerId: id,
        x: scenario.targets[id].x,
        y: scenario.targets[id].y,
      }));

      const result = await service.checkDefenseScenario({
        scenarioId: scenario.id,
        placements,
      });

      expect(result.perPlayer).toHaveLength(playerIds.length);
      expect(result.correctCount).toBe(playerIds.length);
    });
  });

  // ─── checkRoleReception ──────────────────────────────────────────────────

  describe('checkRoleReception', () => {
    it('should throw BadRequestException for invalid rotation', async () => {
      formationConfigService.getZoneForPlayer.mockResolvedValue(null);
      await expect(
        service.checkRoleReception({
          rotation: 99,
          roleId: 1,
          placement: { x: 50, y: 50 },
          elapsedSeconds: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid roleId', async () => {
      formationConfigService.getZoneForPlayer.mockResolvedValue(null);
      const rotation = ROTATIONS[0];
      await expect(
        service.checkRoleReception({
          rotation: rotation.rotation,
          roleId: 999,
          placement: { x: 50, y: 50 },
          elapsedSeconds: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when game is not configured', async () => {
      formationConfigService.getZoneForPlayer.mockResolvedValue(null);
      const rotation = ROTATIONS[0];
      const player = rotation.players[0];
      await expect(
        service.checkRoleReception({
          rotation: rotation.rotation,
          roleId: player.id,
          placement: { x: player.point.x, y: player.point.y },
          elapsedSeconds: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return correct=true when placement is inside zone', async () => {
      const rotation = ROTATIONS[0];
      const player = rotation.players[0];
      const zone: ZoneConfig = {
        playerId: player.id,
        x: player.point.x - 15,
        y: player.point.y - 15,
        w: 30,
        h: 30,
      };
      formationConfigService.getZoneForPlayer.mockResolvedValue(zone);

      const result = await service.checkRoleReception({
        rotation: rotation.rotation,
        roleId: player.id,
        placement: { x: player.point.x, y: player.point.y },
        elapsedSeconds: 5,
      });

      expect(result.correct).toBe(true);
      expect(result.roundPoints).toBeGreaterThan(0);
      expect(result.target.zone).toBe(player.zone);
    });

    it('should return correct=false when placement is outside zone', async () => {
      const rotation = ROTATIONS[0];
      const player = rotation.players[0];
      const zone: ZoneConfig = {
        playerId: player.id,
        x: player.point.x - 15,
        y: player.point.y - 15,
        w: 30,
        h: 30,
      };
      formationConfigService.getZoneForPlayer.mockResolvedValue(zone);

      const result = await service.checkRoleReception({
        rotation: rotation.rotation,
        roleId: player.id,
        placement: { x: player.point.x + 200, y: player.point.y + 200 },
        elapsedSeconds: 5,
      });

      expect(result.correct).toBe(false);
      expect(result.roundPoints).toBe(0);
    });
  });

  // ─── checkRoleDefense ────────────────────────────────────────────────────

  describe('checkRoleDefense', () => {
    it('should throw BadRequestException for invalid roundId', async () => {
      formationConfigService.getZoneForPlayer.mockResolvedValue(null);
      await expect(
        service.checkRoleDefense({
          roundId: 999,
          roleId: 1,
          placement: { x: 50, y: 50 },
          elapsedSeconds: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid roleId in round', async () => {
      formationConfigService.getZoneForPlayer.mockResolvedValue(null);
      const round = DEFENSE_ROUNDS[0];
      await expect(
        service.checkRoleDefense({
          roundId: round.id,
          roleId: 999,
          placement: { x: 50, y: 50 },
          elapsedSeconds: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when game is not configured', async () => {
      formationConfigService.getZoneForPlayer.mockResolvedValue(null);
      const round = DEFENSE_ROUNDS[0];
      const player = round.rotation.players[0];
      await expect(
        service.checkRoleDefense({
          roundId: round.id,
          roleId: player.id,
          placement: { x: 50, y: 50 },
          elapsedSeconds: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return correct=true and points when placement is inside zone', async () => {
      const round = DEFENSE_ROUNDS[0];
      const player = round.rotation.players[0];
      const zone: ZoneConfig = { playerId: player.id, x: 30, y: 30, w: 40, h: 40 };
      formationConfigService.getZoneForPlayer.mockResolvedValue(zone);

      const result = await service.checkRoleDefense({
        roundId: round.id,
        roleId: player.id,
        placement: { x: 50, y: 50 },
        elapsedSeconds: 5,
      });

      expect(result.correct).toBe(true);
      expect(result.roundPoints).toBeGreaterThan(0);
      expect(result.target).toHaveProperty('zone');
      expect(result.target).toHaveProperty('point');
    });

    it('should return correct=false and 0 points for placement outside zone', async () => {
      const round = DEFENSE_ROUNDS[0];
      const player = round.rotation.players[0];
      const zone: ZoneConfig = { playerId: player.id, x: 30, y: 30, w: 10, h: 10 };
      formationConfigService.getZoneForPlayer.mockResolvedValue(zone);

      const result = await service.checkRoleDefense({
        roundId: round.id,
        roleId: player.id,
        placement: { x: 90, y: 90 },
        elapsedSeconds: 5,
      });

      expect(result.correct).toBe(false);
      expect(result.roundPoints).toBe(0);
    });
  });

  // ─── completeTrainingGame ───────────────────────────────────────────────

  describe('completeTrainingGame', () => {
    it('should persist score with scoring service for allowed training games', async () => {
      const result = await service.completeTrainingGame('user-uuid-1', {
        game: 'reception_5_1' as any,
        rawPoints: 980,
        roundsCompleted: 6,
        roundsCorrect: 5,
      });

      expect(scoringService.applyGameScore).toHaveBeenCalled();
      expect(result.awardedPoints).toBe(378);
    });

    it('should throw BadRequestException for unsupported games', async () => {
      await expect(
        service.completeTrainingGame('user-uuid-1', {
          game: 'quiz' as any,
          rawPoints: 1000,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

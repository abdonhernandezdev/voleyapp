import { BadRequestException, Injectable } from '@nestjs/common';
import { DefenseScenarioCheckDto, PlacementDto } from '../dto/training.dto';
import { DEFENSE_SCENARIOS, Point } from '../training.constants';
import { FormationConfigService, ZoneConfig } from '../../formation-config/formation-config.service';
import { isInRect } from '../zone-validator';

@Injectable()
export class DefenseScenarioValidator {
  constructor(private readonly formationConfigService: FormationConfigService) {}

  async validate(dto: DefenseScenarioCheckDto) {
    const scenario = DEFENSE_SCENARIOS.find((entry) => entry.id === dto.scenarioId);
    if (!scenario) {
      throw new BadRequestException('Escenario de defensa no valido');
    }

    const zones = await this.formationConfigService.getZonesForRotation(
      'defense',
      null,
      dto.scenarioId - 1,
    );
    if (zones.length < 6) {
      throw new BadRequestException('Juego no configurado');
    }

    const zoneMap = new Map<number, ZoneConfig>(zones.map((z) => [z.playerId, z]));

    const expectedIds = new Set(Object.keys(scenario.targets).map((id) => Number(id)));
    const placementMap = this.toPlacementMap(dto.placements, expectedIds);

    const perPlayer = Array.from(expectedIds).map((playerId) => {
      const position = placementMap.get(playerId)!;
      const zone = zoneMap.get(playerId);
      return {
        playerId,
        correct: zone ? isInRect(position, zone) : false,
      };
    });

    return {
      perPlayer,
      correctCount: perPlayer.filter((entry) => entry.correct).length,
    };
  }

  private toPlacementMap(placements: PlacementDto[], expectedIds: Set<number>): Map<number, Point> {
    if (placements.length !== expectedIds.size) {
      throw new BadRequestException('Numero de posiciones invalido');
    }

    const map = new Map<number, Point>();
    for (const placement of placements) {
      if (!expectedIds.has(placement.playerId)) {
        throw new BadRequestException('Jugador no valido en las posiciones enviadas');
      }
      if (map.has(placement.playerId)) {
        throw new BadRequestException('Hay jugadores repetidos en las posiciones');
      }
      map.set(placement.playerId, {
        x: placement.x,
        y: placement.y,
      });
    }

    return map;
  }
}

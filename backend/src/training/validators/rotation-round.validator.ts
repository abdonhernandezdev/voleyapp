import { BadRequestException, Injectable } from '@nestjs/common';
import { PlacementDto, RotationRoundCheckDto } from '../dto/training.dto';
import { getRotationSet, Point, RotationRole } from '../training.constants';
import { FormationConfigService, ZoneConfig } from '../../formation-config/formation-config.service';
import { isInRect } from '../zone-validator';

interface RotationEvalToken {
  id: number;
  role: RotationRole;
  targetPoint: Point;
  position: Point;
}

@Injectable()
export class RotationRoundValidator {
  private readonly rotationPointsPerCorrect = 30;
  private readonly rotationPerfectBonus = 120;
  private readonly rotationSpeedBonusCap = 60;

  constructor(private readonly formationConfigService: FormationConfigService) {}

  async validate(dto: RotationRoundCheckDto) {
    const system = dto.system ?? '5-1';
    const rotationSet = getRotationSet(system);
    const rotation = rotationSet.find((entry) => entry.rotation === dto.rotation);
    if (!rotation) {
      throw new BadRequestException('Rotacion no valida');
    }

    const zones = await this.formationConfigService.getZonesForRotation(
      'reception',
      system,
      dto.rotation - 1,
    );
    if (zones.length < 6) {
      throw new BadRequestException('Juego no configurado');
    }

    const zoneMap = new Map<number, ZoneConfig>(zones.map((z) => [z.playerId, z]));

    const expectedIds = new Set(rotation.players.map((player) => player.id));
    const placementMap = this.toPlacementMap(dto.placements, expectedIds);

    const tokens: RotationEvalToken[] = rotation.players.map((player) => ({
      id: player.id,
      role: player.role,
      targetPoint: player.point,
      position: placementMap.get(player.id)!,
    }));

    const byRole = {
      Colocador: tokens.filter((token) => token.role === 'Colocador'),
      Opuesto: tokens.filter((token) => token.role === 'Opuesto'),
      Central: tokens.filter((token) => token.role === 'Central'),
      Receptor: tokens.filter((token) => token.role === 'Receptor'),
      Atacante: tokens.filter((token) => token.role === 'Atacante'),
    };

    const evaluation = new Map<number, boolean>();

    for (const token of byRole.Colocador) {
      const zone = zoneMap.get(token.id);
      evaluation.set(token.id, zone ? isInRect(token.position, zone) : false);
    }

    for (const token of byRole.Opuesto) {
      const zone = zoneMap.get(token.id);
      evaluation.set(token.id, zone ? isInRect(token.position, zone) : false);
    }

    if (byRole.Central.length === 2) {
      const result = this.evaluatePairWithZones(byRole.Central[0], byRole.Central[1], zoneMap);
      evaluation.set(byRole.Central[0].id, result[byRole.Central[0].id]);
      evaluation.set(byRole.Central[1].id, result[byRole.Central[1].id]);
    } else {
      for (const token of byRole.Central) {
        const zone = zoneMap.get(token.id);
        evaluation.set(token.id, zone ? isInRect(token.position, zone) : false);
      }
    }

    if (byRole.Receptor.length === 2) {
      const result = this.evaluatePairWithZones(byRole.Receptor[0], byRole.Receptor[1], zoneMap);
      evaluation.set(byRole.Receptor[0].id, result[byRole.Receptor[0].id]);
      evaluation.set(byRole.Receptor[1].id, result[byRole.Receptor[1].id]);
    } else {
      for (const token of byRole.Receptor) {
        const zone = zoneMap.get(token.id);
        evaluation.set(token.id, zone ? isInRect(token.position, zone) : false);
      }
    }

    for (const token of byRole.Atacante) {
      const zone = zoneMap.get(token.id);
      evaluation.set(token.id, zone ? isInRect(token.position, zone) : false);
    }

    const perPlayer = tokens.map((token) => ({
      playerId: token.id,
      correct: evaluation.get(token.id) ?? false,
    }));
    const correctCount = perPlayer.filter((entry) => entry.correct).length;

    const roundPoints =
      correctCount * this.rotationPointsPerCorrect +
      (correctCount === 6 ? this.rotationPerfectBonus : 0) +
      (correctCount === 6 ? Math.max(0, this.rotationSpeedBonusCap - dto.elapsedSeconds) : 0);

    return {
      perPlayer,
      correctCount,
      roundPoints,
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

  private evaluatePairWithZones(
    a: RotationEvalToken,
    b: RotationEvalToken,
    zoneMap: Map<number, ZoneConfig>,
  ): Record<number, boolean> {
    const zoneA = zoneMap.get(a.id);
    const zoneB = zoneMap.get(b.id);

    const mA1 = zoneA ? isInRect(a.position, zoneA) : false;
    const mB2 = zoneB ? isInRect(b.position, zoneB) : false;
    const mA2 = zoneB ? isInRect(a.position, zoneB) : false;
    const mB1 = zoneA ? isInRect(b.position, zoneA) : false;

    const scoreNormal = Number(mA1) + Number(mB2);
    const scoreSwapped = Number(mA2) + Number(mB1);

    if (scoreSwapped > scoreNormal) {
      return {
        [a.id]: mA2,
        [b.id]: mB1,
      };
    }

    return {
      [a.id]: mA1,
      [b.id]: mB2,
    };
  }
}

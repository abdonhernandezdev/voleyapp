import { BadRequestException, Injectable } from '@nestjs/common';
import { RoleDefenseCheckDto } from '../dto/training.dto';
import {
  DEFENSE_ROUNDS,
  DefenseRound,
  RotationPlayer,
  TargetPoint,
} from '../training.constants';
import { FormationConfigService } from '../../formation-config/formation-config.service';
import { isInRect } from '../zone-validator';

@Injectable()
export class RoleDefenseValidator {
  private readonly roleDefenseBasePoints = 70;
  private readonly roleDefenseSpeedBonusCap = 20;

  constructor(private readonly formationConfigService: FormationConfigService) {}

  async validate(dto: RoleDefenseCheckDto) {
    const round = DEFENSE_ROUNDS.find((entry) => entry.id === dto.roundId);
    if (!round) {
      throw new BadRequestException('Ronda de defensa no valida');
    }

    const selected = round.rotation.players.find((player) => player.id === dto.roleId);
    if (!selected) {
      throw new BadRequestException('Rol no valido para esta ronda');
    }

    const scenarioIdx = round.scenario.id - 1;
    const slot = this.getDefenseSlot(selected);

    const zone = await this.formationConfigService.getZoneForPlayer(
      'defense',
      null,
      scenarioIdx,
      slot,
    );
    if (!zone) {
      throw new BadRequestException('Juego no configurado');
    }

    const targetPoint = this.resolveDefenseTargetPoint(round, selected);
    const matched = isInRect(dto.placement, zone);
    const roundPoints = matched
      ? this.roleDefenseBasePoints + Math.max(0, this.roleDefenseSpeedBonusCap - dto.elapsedSeconds)
      : 0;

    return {
      correct: matched,
      roundPoints,
      target: {
        zone: selected.zone,
        point: targetPoint,
      },
    };
  }

  private resolveDefenseTargetPoint(round: DefenseRound, player: RotationPlayer): TargetPoint {
    const slot = this.getDefenseSlot(player);
    return round.scenario.targets[slot];
  }

  private getDefenseSlot(player: RotationPlayer): 1 | 2 | 3 | 4 | 5 | 6 {
    const front = player.zone === 4 || player.zone === 3 || player.zone === 2;
    if (player.role === 'Central') {
      return front ? 2 : 4;
    }
    if (player.role === 'Receptor') {
      return front ? 3 : 5;
    }
    return front ? 1 : 6;
  }
}

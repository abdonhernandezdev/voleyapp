import { BadRequestException, Injectable } from '@nestjs/common';
import { RoleReceptionCheckDto } from '../dto/training.dto';
import { ROTATIONS } from '../training.constants';
import { FormationConfigService } from '../../formation-config/formation-config.service';
import { isInRect } from '../zone-validator';

@Injectable()
export class RoleReceptionValidator {
  private readonly roleReceptionBasePoints = 65;
  private readonly roleReceptionSpeedBonusCap = 20;

  constructor(private readonly formationConfigService: FormationConfigService) {}

  async validate(dto: RoleReceptionCheckDto) {
    const rotation = ROTATIONS.find((entry) => entry.rotation === dto.rotation);
    if (!rotation) {
      throw new BadRequestException('Rotacion no valida');
    }

    const selected = rotation.players.find((player) => player.id === dto.roleId);
    if (!selected) {
      throw new BadRequestException('Rol no valido para esta rotacion');
    }

    const zone = await this.formationConfigService.getZoneForPlayer(
      'reception',
      '5-1',
      dto.rotation - 1,
      dto.roleId,
    );
    if (!zone) {
      throw new BadRequestException('Juego no configurado');
    }

    const matched = isInRect(dto.placement, zone);

    const roundPoints = matched
      ? this.roleReceptionBasePoints + Math.max(0, this.roleReceptionSpeedBonusCap - dto.elapsedSeconds)
      : 0;

    return {
      correct: matched,
      roundPoints,
      target: {
        zone: selected.zone,
        point: selected.point,
      },
    };
  }
}

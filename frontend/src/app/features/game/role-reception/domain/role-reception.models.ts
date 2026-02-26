import { ROTATIONS, RotationRole } from '../../rotation-sim/domain/rotation-sim.models';

export type RoleReceptionState = 'setup' | 'playing' | 'checked' | 'finished';

export interface RoleOption {
  id: number;
  label: string;
  role: RotationRole;
}

export const ROLE_OPTIONS: RoleOption[] = ROTATIONS[0].players.map((player) => ({
  id: player.id,
  label: player.label,
  role: player.role,
}));

export const RECEPTION_ROUNDS = ROTATIONS;

import { DEFENSE_SCENARIOS, DefenseScenario } from '../../field-challenge/domain/field-challenge.models';
import { ROTATIONS } from '../../rotation-sim/domain/rotation-sim.models';
import { ROLE_OPTIONS } from '../../role-reception/domain/role-reception.models';

export type RoleDefenseState = 'setup' | 'playing' | 'checked' | 'finished';

export interface DefenseRound {
  id: number;
  scenario: DefenseScenario;
  rotation: (typeof ROTATIONS)[number];
}

const DEFENSE_SEQUENCE: Array<DefenseScenario['rivalAttackZone']> = [4, 2, 3, 4, 2, 3];

const scenarioByZone = DEFENSE_SCENARIOS.reduce((acc, scenario) => {
  acc.set(scenario.rivalAttackZone, scenario);
  return acc;
}, new Map<DefenseScenario['rivalAttackZone'], DefenseScenario>());

export const DEFENSE_ROUNDS: DefenseRound[] = ROTATIONS.map((rotation, index) => {
  const attackZone = DEFENSE_SEQUENCE[index];
  const scenario = scenarioByZone.get(attackZone);
  if (!scenario) {
    throw new Error(`Defense scenario not found for attack zone ${attackZone}`);
  }
  return {
    id: index + 1,
    scenario,
    rotation,
  };
});

export const DEFENSE_ROLE_OPTIONS = ROLE_OPTIONS;

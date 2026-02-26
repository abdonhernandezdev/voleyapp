export interface Point {
  x: number;
  y: number;
}

export interface TargetPoint extends Point {
  tolerance: number;
}

export type RotationRole = 'Colocador' | 'Opuesto' | 'Receptor' | 'Central' | 'Atacante';

export type ReceptionSystem = '5-1' | '4-2' | '6-2';

export interface RotationPlayer {
  id: number;
  label: string;
  role: RotationRole;
  zone: number;
  point: Point;
  receiver?: boolean;
}

export interface RotationShape {
  name: string;
  rotation: number;
  description: string;
  players: RotationPlayer[];
}

export interface DefenseScenario {
  id: number;
  title: string;
  rivalAttackZone: 2 | 3 | 4;
  blockType: 'simple' | 'doble';
  description: string;
  cues: string[];
  targets: Record<number, TargetPoint>;
}

export interface DefenseRound {
  id: number;
  scenario: DefenseScenario;
  rotation: RotationShape;
}

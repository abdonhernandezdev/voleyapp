export interface Point {
  x: number;
  y: number;
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

export interface SystemInfo {
  system: ReceptionSystem;
  label: string;
  description: string;
  roles: string;
}

export const SYSTEM_INFO: SystemInfo[] = [
  {
    system: '5-1',
    label: 'Sistema 5-1',
    description: '1 colocador siempre coloca. 1 opuesto, 2 centrales, 2 receptores.',
    roles: 'Colocador · Opuesto · Central x2 · Receptor x2',
  },
  {
    system: '4-2',
    label: 'Sistema 4-2',
    description: '2 colocadores opuestos entre si. El delantero coloca. 4 atacantes en W.',
    roles: 'Colocador x2 · Atacante x4',
  },
  {
    system: '6-2',
    label: 'Sistema 6-2',
    description: '2 colocadores opuestos. El de trasera sale a colocar. Siempre 3 delanteros.',
    roles: 'Colocador x2 · Receptor x2 · Central x2',
  },
];

export interface GameToken {
  id: number;
  label: string;
  role: RotationRole;
  targetZone: number;
  targetPoint: Point;
  receiver: boolean;
  position: Point | null;
  isCorrect: boolean | null;
}

export type GameState = 'selecting' | 'setup' | 'playing' | 'checked' | 'finished';

export const ROTATIONS: RotationShape[] = [
  {
    name: 'Rotacion 1',
    rotation: 1,
    description: 'R1 segun tu esquema.',
    players: [
      { id: 1, label: 'Colocador', role: 'Colocador', zone: 1, point: { x: 89, y: 60 } },
      { id: 2, label: 'Central 1', role: 'Central', zone: 3, point: { x: 50, y: 21 } },
      { id: 3, label: 'Central 2', role: 'Central', zone: 6, point: { x: 59, y: 75 } },
      { id: 4, label: 'Receptor 1', role: 'Receptor', zone: 5, point: { x: 33, y: 75 }, receiver: true },
      { id: 5, label: 'Receptor 2', role: 'Receptor', zone: 2, point: { x: 74, y: 53 }, receiver: true },
      { id: 6, label: 'Opuesto', role: 'Opuesto', zone: 4, point: { x: 13, y: 53 }, receiver: true },
    ],
  },
  {
    name: 'Rotacion 6',
    rotation: 6,
    description: 'R6 segun tu esquema.',
    players: [
      { id: 1, label: 'Colocador', role: 'Colocador', zone: 6, point: { x: 56, y: 30 } },
      { id: 2, label: 'Central 1', role: 'Central', zone: 2, point: { x: 50, y: 21 } },
      { id: 3, label: 'Central 2', role: 'Central', zone: 5, point: { x: 33, y: 75 } },
      { id: 4, label: 'Receptor 1', role: 'Receptor', zone: 4, point: { x: 16, y: 50 }, receiver: true },
      { id: 5, label: 'Receptor 2', role: 'Receptor', zone: 1, point: { x: 67, y: 75 }, receiver: true },
      { id: 6, label: 'Opuesto', role: 'Opuesto', zone: 3, point: { x: 89, y: 60 }, receiver: true },
    ],
  },
  {
    name: 'Rotacion 5',
    rotation: 5,
    description: 'R5 segun tu esquema.',
    players: [
      { id: 1, label: 'Colocador', role: 'Colocador', zone: 5, point: { x: 24, y: 26 } },
      { id: 2, label: 'Central 1', role: 'Central', zone: 1, point: { x: 52, y: 69 } },
      { id: 3, label: 'Central 2', role: 'Central', zone: 4, point: { x: 6, y: 12 } },
      { id: 4, label: 'Receptor 1', role: 'Receptor', zone: 3, point: { x: 13, y: 48 }, receiver: true },
      { id: 5, label: 'Receptor 2', role: 'Receptor', zone: 6, point: { x: 34, y: 69 }, receiver: true },
      { id: 6, label: 'Opuesto', role: 'Opuesto', zone: 2, point: { x: 79, y: 53 }, receiver: true },
    ],
  },
  {
    name: 'Rotacion 4',
    rotation: 4,
    description: 'R4 segun tu esquema.',
    players: [
      { id: 1, label: 'Colocador', role: 'Colocador', zone: 4, point: { x: 4, y: 13 } },
      { id: 2, label: 'Central 1', role: 'Central', zone: 6, point: { x: 52, y: 67 } },
      { id: 3, label: 'Central 2', role: 'Central', zone: 3, point: { x: 13, y: 29 } },
      { id: 4, label: 'Receptor 1', role: 'Receptor', zone: 2, point: { x: 13, y: 53 }, receiver: true },
      { id: 5, label: 'Receptor 2', role: 'Receptor', zone: 5, point: { x: 33, y: 67 }, receiver: true },
      { id: 6, label: 'Opuesto', role: 'Opuesto', zone: 1, point: { x: 83, y: 57 }, receiver: true },
    ],
  },
  {
    name: 'Rotacion 3',
    rotation: 3,
    description: 'R3 segun tu esquema.',
    players: [
      { id: 1, label: 'Colocador', role: 'Colocador', zone: 3, point: { x: 50, y: 22 } },
      { id: 2, label: 'Central 1', role: 'Central', zone: 5, point: { x: 34, y: 75 } },
      { id: 3, label: 'Central 2', role: 'Central', zone: 2, point: { x: 91, y: 20 } },
      { id: 4, label: 'Receptor 1', role: 'Receptor', zone: 1, point: { x: 83, y: 57 }, receiver: true },
      { id: 5, label: 'Receptor 2', role: 'Receptor', zone: 4, point: { x: 14, y: 53 }, receiver: true },
      { id: 6, label: 'Opuesto', role: 'Opuesto', zone: 6, point: { x: 63, y: 75 }, receiver: true },
    ],
  },
  {
    name: 'Rotacion 2',
    rotation: 2,
    description: 'R2 segun tu esquema.',
    players: [
      { id: 1, label: 'Colocador', role: 'Colocador', zone: 2, point: { x: 89, y: 22 } },
      { id: 2, label: 'Central 1', role: 'Central', zone: 4, point: { x: 10, y: 23 } },
      { id: 3, label: 'Central 2', role: 'Central', zone: 1, point: { x: 80, y: 54 } },
      { id: 4, label: 'Receptor 1', role: 'Receptor', zone: 6, point: { x: 58, y: 76 }, receiver: true },
      { id: 5, label: 'Receptor 2', role: 'Receptor', zone: 3, point: { x: 18, y: 54 }, receiver: true },
      { id: 6, label: 'Opuesto', role: 'Opuesto', zone: 5, point: { x: 38, y: 76 }, receiver: true },
    ],
  },
];

export const ROTATIONS_4_2: RotationShape[] = [
  {
    name: 'Rotacion 1 (4-2)',
    rotation: 1,
    description: 'R1 sistema 4-2. Colocador 1 delantero coloca.',
    players: [
      { id: 1, label: 'Colocador 1', role: 'Colocador', zone: 2, point: { x: 88, y: 20 } },
      { id: 2, label: 'Colocador 2', role: 'Colocador', zone: 5, point: { x: 17, y: 72 } },
      { id: 3, label: 'Atacante 1', role: 'Atacante', zone: 1, point: { x: 83, y: 72 }, receiver: true },
      { id: 4, label: 'Atacante 2', role: 'Atacante', zone: 6, point: { x: 50, y: 72 }, receiver: true },
      { id: 5, label: 'Atacante 3', role: 'Atacante', zone: 3, point: { x: 50, y: 45 }, receiver: true },
      { id: 6, label: 'Atacante 4', role: 'Atacante', zone: 4, point: { x: 17, y: 45 }, receiver: true },
    ],
  },
  {
    name: 'Rotacion 2 (4-2)',
    rotation: 2,
    description: 'R2 sistema 4-2. Colocador 2 delantero coloca.',
    players: [
      { id: 1, label: 'Colocador 1', role: 'Colocador', zone: 1, point: { x: 83, y: 72 } },
      { id: 2, label: 'Colocador 2', role: 'Colocador', zone: 4, point: { x: 17, y: 22 } },
      { id: 3, label: 'Atacante 1', role: 'Atacante', zone: 2, point: { x: 83, y: 22 }, receiver: true },
      { id: 4, label: 'Atacante 2', role: 'Atacante', zone: 5, point: { x: 17, y: 72 }, receiver: true },
      { id: 5, label: 'Atacante 3', role: 'Atacante', zone: 6, point: { x: 50, y: 72 }, receiver: true },
      { id: 6, label: 'Atacante 4', role: 'Atacante', zone: 3, point: { x: 50, y: 45 }, receiver: true },
    ],
  },
  {
    name: 'Rotacion 3 (4-2)',
    rotation: 3,
    description: 'R3 sistema 4-2. Colocador 2 delantero coloca.',
    players: [
      { id: 1, label: 'Colocador 1', role: 'Colocador', zone: 6, point: { x: 50, y: 72 } },
      { id: 2, label: 'Colocador 2', role: 'Colocador', zone: 3, point: { x: 50, y: 22 } },
      { id: 3, label: 'Atacante 1', role: 'Atacante', zone: 1, point: { x: 83, y: 72 }, receiver: true },
      { id: 4, label: 'Atacante 2', role: 'Atacante', zone: 4, point: { x: 17, y: 22 }, receiver: true },
      { id: 5, label: 'Atacante 3', role: 'Atacante', zone: 2, point: { x: 83, y: 45 }, receiver: true },
      { id: 6, label: 'Atacante 4', role: 'Atacante', zone: 5, point: { x: 17, y: 45 }, receiver: true },
    ],
  },
  {
    name: 'Rotacion 4 (4-2)',
    rotation: 4,
    description: 'R4 sistema 4-2. Colocador 2 delantero coloca.',
    players: [
      { id: 1, label: 'Colocador 1', role: 'Colocador', zone: 5, point: { x: 17, y: 72 } },
      { id: 2, label: 'Colocador 2', role: 'Colocador', zone: 2, point: { x: 83, y: 22 } },
      { id: 3, label: 'Atacante 1', role: 'Atacante', zone: 4, point: { x: 17, y: 22 }, receiver: true },
      { id: 4, label: 'Atacante 2', role: 'Atacante', zone: 1, point: { x: 83, y: 72 }, receiver: true },
      { id: 5, label: 'Atacante 3', role: 'Atacante', zone: 6, point: { x: 50, y: 72 }, receiver: true },
      { id: 6, label: 'Atacante 4', role: 'Atacante', zone: 3, point: { x: 50, y: 45 }, receiver: true },
    ],
  },
  {
    name: 'Rotacion 5 (4-2)',
    rotation: 5,
    description: 'R5 sistema 4-2. Colocador 1 delantero coloca.',
    players: [
      { id: 1, label: 'Colocador 1', role: 'Colocador', zone: 4, point: { x: 17, y: 22 } },
      { id: 2, label: 'Colocador 2', role: 'Colocador', zone: 1, point: { x: 83, y: 72 } },
      { id: 3, label: 'Atacante 1', role: 'Atacante', zone: 3, point: { x: 50, y: 22 }, receiver: true },
      { id: 4, label: 'Atacante 2', role: 'Atacante', zone: 6, point: { x: 50, y: 72 }, receiver: true },
      { id: 5, label: 'Atacante 3', role: 'Atacante', zone: 5, point: { x: 17, y: 72 }, receiver: true },
      { id: 6, label: 'Atacante 4', role: 'Atacante', zone: 2, point: { x: 83, y: 45 }, receiver: true },
    ],
  },
  {
    name: 'Rotacion 6 (4-2)',
    rotation: 6,
    description: 'R6 sistema 4-2. Colocador 1 delantero coloca.',
    players: [
      { id: 1, label: 'Colocador 1', role: 'Colocador', zone: 3, point: { x: 50, y: 22 } },
      { id: 2, label: 'Colocador 2', role: 'Colocador', zone: 6, point: { x: 50, y: 72 } },
      { id: 3, label: 'Atacante 1', role: 'Atacante', zone: 2, point: { x: 83, y: 22 }, receiver: true },
      { id: 4, label: 'Atacante 2', role: 'Atacante', zone: 5, point: { x: 17, y: 72 }, receiver: true },
      { id: 5, label: 'Atacante 3', role: 'Atacante', zone: 4, point: { x: 17, y: 22 }, receiver: true },
      { id: 6, label: 'Atacante 4', role: 'Atacante', zone: 1, point: { x: 83, y: 72 }, receiver: true },
    ],
  },
];

export const ROTATIONS_6_2: RotationShape[] = [
  {
    name: 'Rotacion 1 (6-2)',
    rotation: 1,
    description: 'R1 sistema 6-2. Colocador 1 de trasera sale a colocar.',
    players: [
      { id: 1, label: 'Colocador 1', role: 'Colocador', zone: 6, point: { x: 50, y: 60 } },
      { id: 2, label: 'Colocador 2', role: 'Colocador', zone: 3, point: { x: 50, y: 22 } },
      { id: 3, label: 'Receptor 1', role: 'Receptor', zone: 5, point: { x: 17, y: 75 }, receiver: true },
      { id: 4, label: 'Receptor 2', role: 'Receptor', zone: 2, point: { x: 83, y: 45 }, receiver: true },
      { id: 5, label: 'Central 1', role: 'Central', zone: 4, point: { x: 17, y: 22 } },
      { id: 6, label: 'Central 2', role: 'Central', zone: 1, point: { x: 83, y: 75 } },
    ],
  },
  {
    name: 'Rotacion 2 (6-2)',
    rotation: 2,
    description: 'R2 sistema 6-2. Colocador 1 de trasera sale a colocar.',
    players: [
      { id: 1, label: 'Colocador 1', role: 'Colocador', zone: 5, point: { x: 17, y: 60 } },
      { id: 2, label: 'Colocador 2', role: 'Colocador', zone: 2, point: { x: 83, y: 22 } },
      { id: 3, label: 'Receptor 1', role: 'Receptor', zone: 4, point: { x: 17, y: 22 }, receiver: true },
      { id: 4, label: 'Receptor 2', role: 'Receptor', zone: 1, point: { x: 83, y: 75 }, receiver: true },
      { id: 5, label: 'Central 1', role: 'Central', zone: 3, point: { x: 50, y: 22 } },
      { id: 6, label: 'Central 2', role: 'Central', zone: 6, point: { x: 50, y: 75 } },
    ],
  },
  {
    name: 'Rotacion 3 (6-2)',
    rotation: 3,
    description: 'R3 sistema 6-2. Colocador 2 de trasera sale a colocar.',
    players: [
      { id: 1, label: 'Colocador 1', role: 'Colocador', zone: 4, point: { x: 17, y: 22 } },
      { id: 2, label: 'Colocador 2', role: 'Colocador', zone: 1, point: { x: 83, y: 72 } },
      { id: 3, label: 'Receptor 1', role: 'Receptor', zone: 3, point: { x: 50, y: 22 }, receiver: true },
      { id: 4, label: 'Receptor 2', role: 'Receptor', zone: 6, point: { x: 50, y: 75 }, receiver: true },
      { id: 5, label: 'Central 1', role: 'Central', zone: 2, point: { x: 83, y: 22 } },
      { id: 6, label: 'Central 2', role: 'Central', zone: 5, point: { x: 17, y: 75 } },
    ],
  },
  {
    name: 'Rotacion 4 (6-2)',
    rotation: 4,
    description: 'R4 sistema 6-2. Colocador 2 de trasera sale a colocar.',
    players: [
      { id: 1, label: 'Colocador 1', role: 'Colocador', zone: 3, point: { x: 50, y: 22 } },
      { id: 2, label: 'Colocador 2', role: 'Colocador', zone: 6, point: { x: 50, y: 72 } },
      { id: 3, label: 'Receptor 1', role: 'Receptor', zone: 2, point: { x: 83, y: 45 }, receiver: true },
      { id: 4, label: 'Receptor 2', role: 'Receptor', zone: 5, point: { x: 17, y: 75 }, receiver: true },
      { id: 5, label: 'Central 1', role: 'Central', zone: 1, point: { x: 83, y: 75 } },
      { id: 6, label: 'Central 2', role: 'Central', zone: 4, point: { x: 17, y: 22 } },
    ],
  },
  {
    name: 'Rotacion 5 (6-2)',
    rotation: 5,
    description: 'R5 sistema 6-2. Colocador 2 de trasera sale a colocar.',
    players: [
      { id: 1, label: 'Colocador 1', role: 'Colocador', zone: 2, point: { x: 83, y: 22 } },
      { id: 2, label: 'Colocador 2', role: 'Colocador', zone: 5, point: { x: 17, y: 72 } },
      { id: 3, label: 'Receptor 1', role: 'Receptor', zone: 1, point: { x: 83, y: 75 }, receiver: true },
      { id: 4, label: 'Receptor 2', role: 'Receptor', zone: 4, point: { x: 17, y: 22 }, receiver: true },
      { id: 5, label: 'Central 1', role: 'Central', zone: 6, point: { x: 50, y: 75 } },
      { id: 6, label: 'Central 2', role: 'Central', zone: 3, point: { x: 50, y: 22 } },
    ],
  },
  {
    name: 'Rotacion 6 (6-2)',
    rotation: 6,
    description: 'R6 sistema 6-2. Colocador 1 de trasera sale a colocar.',
    players: [
      { id: 1, label: 'Colocador 1', role: 'Colocador', zone: 1, point: { x: 83, y: 72 } },
      { id: 2, label: 'Colocador 2', role: 'Colocador', zone: 4, point: { x: 17, y: 22 } },
      { id: 3, label: 'Receptor 1', role: 'Receptor', zone: 6, point: { x: 50, y: 75 }, receiver: true },
      { id: 4, label: 'Receptor 2', role: 'Receptor', zone: 3, point: { x: 50, y: 22 }, receiver: true },
      { id: 5, label: 'Central 1', role: 'Central', zone: 5, point: { x: 17, y: 75 } },
      { id: 6, label: 'Central 2', role: 'Central', zone: 2, point: { x: 83, y: 45 } },
    ],
  },
];

export function getRotationSet(system: ReceptionSystem): RotationShape[] {
  if (system === '4-2') return ROTATIONS_4_2;
  if (system === '6-2') return ROTATIONS_6_2;
  return ROTATIONS;
}

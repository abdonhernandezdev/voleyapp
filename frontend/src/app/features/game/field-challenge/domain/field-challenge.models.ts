export interface FieldPoint {
  x: number; // 0..100
  y: number; // 0..100
}

export interface PlayerToken {
  id: number;
  name: string;
  role: string;
  hint: string;
  position: FieldPoint | null;
  isCorrect: boolean | null;
}

export interface TargetPoint extends FieldPoint {
  tolerance: number;
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

export const BASE_PLAYERS: Omit<PlayerToken, 'position' | 'isCorrect'>[] = [
  { id: 1, name: 'Colocador/Opuesto delantero', role: 'Primera linea', hint: 'Bloqueo o finta' },
  { id: 2, name: 'Central delantero', role: 'Primera linea', hint: 'Bloqueo principal' },
  { id: 3, name: 'Receptor delantero', role: 'Primera linea', hint: 'Bloqueo o finta' },
  { id: 4, name: 'Central trasero', role: 'Segunda linea', hint: 'Zona 5 / linea / diagonal corta' },
  { id: 5, name: 'Receptor trasero', role: 'Segunda linea', hint: 'Diagonal larga / fondo' },
  { id: 6, name: 'Colocador/Opuesto trasero', role: 'Segunda linea', hint: 'Zona 1 / linea / diagonal corta' },
];

export const DEFENSE_SCENARIOS: DefenseScenario[] = [
  {
    id: 1,
    title: 'Ataque rival por zona 4',
    rivalAttackZone: 4,
    blockType: 'doble',
    description: 'Bloqueo: colocador/opuesto delantero + central delantero.',
    cues: [
      'Receptor delantero dentro de 3 metros para la finta.',
      'Central trasero defiende diagonal corta.',
      'Receptor trasero defiende diagonal larga.',
      'Colocador/Opuesto trasero defiende la linea.',
    ],
    targets: {
      1: { x: 90, y: 13, tolerance: 9 },
      2: { x: 78, y: 13, tolerance: 9 },
      3: { x: 48, y: 22, tolerance: 11 },
      4: { x: 28, y: 43, tolerance: 11 },
      5: { x: 29, y: 83, tolerance: 11 },
      6: { x: 89, y: 62, tolerance: 11 },
    },
  },
  {
    id: 2,
    title: 'Ataque rival por zona 2',
    rivalAttackZone: 2,
    blockType: 'doble',
    description: 'Bloqueo: receptor delantero + central delantero.',
    cues: [
      'Colocador/Opuesto delantero dentro de 3 metros para la finta.',
      'Colocador/Opuesto trasero defiende diagonal corta.',
      'Receptor trasero defiende diagonal larga.',
      'Central trasero defiende la linea.',
    ],
    targets: {
      1: { x: 56, y: 21, tolerance: 11 },
      2: { x: 24, y: 13, tolerance: 9 },
      3: { x: 9, y: 13, tolerance: 9 },
      4: { x: 8, y: 63, tolerance: 11 },
      5: { x: 65, y: 81, tolerance: 11 },
      6: { x: 72, y: 43, tolerance: 11 },
    },
  },
  {
    id: 3,
    title: 'Ataque rival por zona 3',
    rivalAttackZone: 3,
    blockType: 'simple',
    description: 'Bloqueo: solo central delantero.',
    cues: [
      'Receptor delantero dentro de 3 metros para la finta.',
      'Colocador/Opuesto delantero dentro de 3 metros para la finta.',
      'Receptor trasero defiende fondo de campo.',
      'Central trasero en zona 5 y Colocador/Opuesto trasero en zona 1.',
    ],
    targets: {
      1: { x: 68, y: 30, tolerance: 12 },
      2: { x: 50, y: 12, tolerance: 10 },
      3: { x: 32, y: 30, tolerance: 12 },
      4: { x: 20, y: 66, tolerance: 11 },
      5: { x: 50, y: 84, tolerance: 12 },
      6: { x: 82, y: 66, tolerance: 11 },
    },
  },
];

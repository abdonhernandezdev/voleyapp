import { Difficulty, QuestionCategory } from '@shared/models/question.model';

export const CATEGORY_META: Record<QuestionCategory, { label: string; icon: string; color: string }> = {
  rotations_k1: { label: 'Rotaciones K1', icon: 'sync_alt', color: '#b80d1a' },
  rotations_k2: { label: 'Rotaciones K2', icon: 'shield', color: '#111111' },
  positions_roles: { label: 'Posiciones y Roles', icon: 'groups', color: '#7f0812' },
  game_systems: { label: 'Sistemas de Juego', icon: 'sports_volleyball', color: '#d62839' },
  basic_rules: { label: 'Reglas Basicas', icon: 'menu_book', color: '#3d3d3d' },
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: 'Facil', color: '#111111' },
  medium: { label: 'Medio', color: '#5f5f5f' },
  hard: { label: 'Dificil', color: '#b80d1a' },
};

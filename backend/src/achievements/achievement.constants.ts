export interface AchievementDefinition {
  code: string;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
  rewardPoints: number;
}

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  {
    code: 'first_session_completed',
    title: 'Primera sesion',
    description: 'Completa tu primera sesion de entrenamiento.',
    icon: 'looks_one',
    tier: 'bronze',
    rewardPoints: 80,
  },
  {
    code: 'streak_3_days',
    title: 'Racha x3',
    description: 'Juega 3 dias seguidos.',
    icon: 'local_fire_department',
    tier: 'bronze',
    rewardPoints: 120,
  },
  {
    code: 'streak_7_days',
    title: 'Racha x7',
    description: 'Juega 7 dias seguidos.',
    icon: 'whatshot',
    tier: 'silver',
    rewardPoints: 240,
  },
  {
    code: 'perfect_session',
    title: 'Sesion perfecta',
    description: 'Responde correctamente todas las preguntas de una sesion.',
    icon: 'verified',
    tier: 'silver',
    rewardPoints: 260,
  },
  {
    code: 'category_master',
    title: 'Maestria de categoria',
    description: 'Consigue 100% de precision acumulada en una categoria.',
    icon: 'military_tech',
    tier: 'gold',
    rewardPoints: 520,
  },
  {
    code: 'rank_climber',
    title: 'Escalador',
    description: 'Mejora tu posicion en el ranking global.',
    icon: 'trending_up',
    tier: 'gold',
    rewardPoints: 560,
  },
  {
    code: 'streak_14_days',
    title: 'Racha x14',
    description: 'Juega 14 dias seguidos.',
    icon: 'local_fire_department',
    tier: 'gold',
    rewardPoints: 700,
  },
  {
    code: 'streak_30_days',
    title: 'Racha x30',
    description: 'Un mes sin fallar.',
    icon: 'whatshot',
    tier: 'gold',
    rewardPoints: 1200,
  },
  {
    code: 'quiz_veteran',
    title: 'Veterano',
    description: 'Completa 10 sesiones de quiz.',
    icon: 'school',
    tier: 'silver',
    rewardPoints: 320,
  },
  {
    code: 'quiz_master',
    title: 'Maestro',
    description: 'Completa 50 sesiones de quiz.',
    icon: 'workspace_premium',
    tier: 'gold',
    rewardPoints: 900,
  },
  {
    code: 'training_fan',
    title: 'Aficionado al entrenamiento',
    description: 'Juega 5 minijuegos de entrenamiento.',
    icon: 'fitness_center',
    tier: 'bronze',
    rewardPoints: 150,
  },
  {
    code: 'training_addict',
    title: 'Adicto al entrenamiento',
    description: 'Juega 20 minijuegos de entrenamiento.',
    icon: 'sports_score',
    tier: 'silver',
    rewardPoints: 420,
  },
  {
    code: 'formation_explorer',
    title: 'Explorador',
    description: 'Juega con el sistema de recepcion 4-2 o 6-2.',
    icon: 'explore',
    tier: 'bronze',
    rewardPoints: 180,
  },
  {
    code: 'all_formations',
    title: 'Enciclopedia tactica',
    description: 'Juega los 3 sistemas de recepcion (5-1, 4-2 y 6-2).',
    icon: 'menu_book',
    tier: 'silver',
    rewardPoints: 360,
  },
  {
    code: 'top_scorer',
    title: 'Anotador',
    description: 'Alcanza 5.000 puntos totales.',
    icon: 'emoji_events',
    tier: 'gold',
    rewardPoints: 800,
  },
  {
    code: 'champion',
    title: 'Campeon',
    description: 'Alcanza 15.000 puntos totales.',
    icon: 'military_tech',
    tier: 'gold',
    rewardPoints: 1500,
  },
];

export const ACHIEVEMENT_CODES = new Set(ACHIEVEMENT_CATALOG.map((achievement) => achievement.code));

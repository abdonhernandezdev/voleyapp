export const AVATAR_ICON_OPTIONS = [
  'sports_volleyball',
  'flash_on',
  'local_fire_department',
  'gps_fixed',
  'diamond',
  'pets',
  'emoji_nature',
  'flight',
  'rocket_launch',
  'star',
] as const;

export type AvatarIcon = (typeof AVATAR_ICON_OPTIONS)[number];

export const LEGACY_AVATAR_TO_ICON: Record<string, AvatarIcon> = {
  sports_volleyball: 'sports_volleyball',
  flash_on: 'flash_on',
  local_fire_department: 'local_fire_department',
  gps_fixed: 'gps_fixed',
  diamond: 'diamond',
  pets: 'pets',
  emoji_nature: 'emoji_nature',
  adventure: 'emoji_nature',
  flight: 'flight',
  rocket_launch: 'rocket_launch',
  star: 'star',
  '🏐': 'sports_volleyball',
  '⚡': 'flash_on',
  '🔥': 'local_fire_department',
  '🎯': 'gps_fixed',
  '💎': 'diamond',
  '🦁': 'pets',
  '🐯': 'emoji_nature',
  '🦅': 'flight',
  '🚀': 'rocket_launch',
  '⭐': 'star',
};

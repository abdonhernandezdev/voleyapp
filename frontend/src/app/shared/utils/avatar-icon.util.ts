import { LEGACY_AVATAR_TO_ICON } from '../constants/avatar.constants';

export function resolveAvatarIcon(raw?: string | null): string {
  if (!raw) return 'account_circle';
  return LEGACY_AVATAR_TO_ICON[raw] ?? 'account_circle';
}

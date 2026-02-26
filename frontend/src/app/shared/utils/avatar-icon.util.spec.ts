import { resolveAvatarIcon } from './avatar-icon.util';

describe('resolveAvatarIcon', () => {
  it('returns fallback when raw is empty', () => {
    expect(resolveAvatarIcon()).toBe('account_circle');
    expect(resolveAvatarIcon('')).toBe('account_circle');
    expect(resolveAvatarIcon(null)).toBe('account_circle');
  });

  it('returns mapped icon for known legacy key', () => {
    expect(resolveAvatarIcon('🏐')).toBe('sports_volleyball');
  });

  it('returns fallback for unknown legacy key', () => {
    expect(resolveAvatarIcon('unknown-avatar')).toBe('account_circle');
  });
});

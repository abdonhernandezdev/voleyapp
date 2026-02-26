export interface Achievement {
  code: string;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
  rewardPoints: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progress?: {
    current: number;
    target: number;
    percent: number;
    text: string;
  } | null;
}

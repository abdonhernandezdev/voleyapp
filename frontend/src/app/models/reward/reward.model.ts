export type RedemptionStatus = 'pending' | 'delivered' | 'cancelled';

export interface Reward {
  id: string;
  coachId: string;
  name: string;
  description: string | null;
  pointCost: number;
  stock: number | null;
  stockAvailable: number | null;
  isActive: boolean;
  canAfford?: boolean;
}

export interface RewardPointsBalance {
  weeklyEarnedPoints: number;
  weeklySpentPoints: number;
  weeklyAvailablePoints: number;
  totalPoints: number;
  weekStartUtc: string;
  weekEndUtc: string;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  reward?: Reward;
  playerId: string;
  player?: { id: string; displayName: string; username: string };
  status: RedemptionStatus;
  pointsSpent: number;
  redeemedAt: string;
  deliveredAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
}

export interface CreateRewardPayload {
  name: string;
  description?: string;
  pointCost: number;
  stock?: number | null;
}

export interface UpdateRewardPayload {
  name?: string;
  description?: string | null;
  pointCost?: number;
  stock?: number | null;
  isActive?: boolean;
}

export interface CoachReward extends Reward {
  stockUsed: number;
  createdAt: string;
  stats: {
    redeemed: number;
    delivered: number;
    pending: number;
  };
}

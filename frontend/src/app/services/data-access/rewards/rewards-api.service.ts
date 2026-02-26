import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  CoachReward,
  CreateRewardPayload,
  Reward,
  RewardPointsBalance,
  RewardRedemption,
  UpdateRewardPayload,
} from '@shared/models/reward.model';

@Injectable({ providedIn: 'root' })
export class RewardsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // Player
  listActiveRewards(): Observable<Reward[]> {
    return this.http.get<Reward[]>(`${this.base}/rewards`);
  }

  getPointsBalance(): Observable<RewardPointsBalance> {
    return this.http.get<RewardPointsBalance>(`${this.base}/rewards/balance`);
  }

  redeemReward(rewardId: string): Observable<RewardRedemption> {
    return this.http.post<RewardRedemption>(`${this.base}/rewards/${rewardId}/redeem`, {});
  }

  getMyRedemptions(): Observable<RewardRedemption[]> {
    return this.http.get<RewardRedemption[]>(`${this.base}/rewards/my-redemptions`);
  }

  // Coach
  getCoachRewards(): Observable<CoachReward[]> {
    return this.http.get<CoachReward[]>(`${this.base}/coach/rewards`);
  }

  createReward(payload: CreateRewardPayload): Observable<CoachReward> {
    return this.http.post<CoachReward>(`${this.base}/coach/rewards`, payload);
  }

  updateReward(rewardId: string, payload: UpdateRewardPayload): Observable<CoachReward> {
    return this.http.patch<CoachReward>(`${this.base}/coach/rewards/${rewardId}`, payload);
  }

  deactivateReward(rewardId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/coach/rewards/${rewardId}`);
  }

  getCoachRedemptions(status?: string): Observable<RewardRedemption[]> {
    const params = status ? `?status=${status}` : '';
    return this.http.get<RewardRedemption[]>(`${this.base}/coach/rewards/redemptions${params}`);
  }

  deliverRedemption(redemptionId: string, notes?: string): Observable<RewardRedemption> {
    return this.http.patch<RewardRedemption>(
      `${this.base}/coach/rewards/redemptions/${redemptionId}/deliver`,
      { notes },
    );
  }

  cancelRedemption(redemptionId: string): Observable<RewardRedemption> {
    return this.http.patch<RewardRedemption>(
      `${this.base}/coach/rewards/redemptions/${redemptionId}/cancel`,
      {},
    );
  }
}

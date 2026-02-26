import { Injectable, inject, signal } from '@angular/core';
import { catchError, EMPTY } from 'rxjs';
import { RewardsApiService } from '@core/services/data-access/rewards-api.service';
import { HttpErrorService } from '@core/services/http-error.service';
import { NotificationService } from '@core/services/notification.service';
import {
  CoachReward,
  Reward,
  RewardPointsBalance,
  RewardRedemption,
} from '@shared/models/reward.model';

@Injectable()
export class RewardsFacade {
  private readonly api = inject(RewardsApiService);
  private readonly httpError = inject(HttpErrorService);
  private readonly notifications = inject(NotificationService);

  readonly rewards = signal<Reward[]>([]);
  readonly myRedemptions = signal<RewardRedemption[]>([]);
  readonly pointsBalance = signal<RewardPointsBalance | null>(null);
  readonly coachRewards = signal<CoachReward[]>([]);
  readonly coachRedemptions = signal<RewardRedemption[]>([]);

  readonly loadingRewards = signal(false);
  readonly loadingMyRedemptions = signal(false);
  readonly loadingCoachRewards = signal(false);
  readonly loadingCoachRedemptions = signal(false);
  readonly redeeming = signal(false);

  readonly rewardsError = signal<string | null>(null);

  loadRewards(): void {
    this.loadingRewards.set(true);
    this.rewardsError.set(null);
    this.api
      .listActiveRewards()
      .pipe(catchError((err: unknown) => { this.rewardsError.set(this.httpError.getMessage(err, 'Error al cargar recompensas.')); return EMPTY; }))
      .subscribe((data) => { this.rewards.set(data); this.loadingRewards.set(false); });
  }

  loadPointsBalance(): void {
    this.api
      .getPointsBalance()
      .pipe(catchError(() => EMPTY))
      .subscribe((balance) => {
        this.pointsBalance.set(balance);
      });
  }

  loadMyRedemptions(): void {
    this.loadingMyRedemptions.set(true);
    this.api
      .getMyRedemptions()
      .pipe(catchError(() => { this.loadingMyRedemptions.set(false); return EMPTY; }))
      .subscribe((data) => { this.myRedemptions.set(data); this.loadingMyRedemptions.set(false); });
  }

  redeemReward(rewardId: string): void {
    if (this.redeeming()) return;
    this.redeeming.set(true);
    this.api
      .redeemReward(rewardId)
      .pipe(catchError((err: unknown) => {
        this.notifications.error(this.httpError.getMessage(err, 'No se pudo canjear la recompensa.'));
        this.redeeming.set(false);
        return EMPTY;
      }))
      .subscribe((redemption) => {
        this.redeeming.set(false);
        this.myRedemptions.update((list) => [redemption, ...list]);
        this.notifications.success('Recompensa canjeada. Espera a que el coach la marque como entregada.');
        this.loadRewards();
        this.loadPointsBalance();
      });
  }

  loadCoachRewards(): void {
    this.loadingCoachRewards.set(true);
    this.api
      .getCoachRewards()
      .pipe(catchError(() => { this.loadingCoachRewards.set(false); return EMPTY; }))
      .subscribe((data) => { this.coachRewards.set(data); this.loadingCoachRewards.set(false); });
  }

  createCoachReward(payload: { name: string; description?: string; pointCost: number; stock?: number | null }, onSuccess?: () => void): void {
    this.api
      .createReward(payload)
      .pipe(catchError((err: unknown) => {
        this.notifications.error(this.httpError.getMessage(err, 'No se pudo crear la recompensa.'));
        return EMPTY;
      }))
      .subscribe((reward) => {
        this.coachRewards.update((list) => [reward, ...list]);
        this.notifications.success('Recompensa creada.');
        onSuccess?.();
      });
  }

  updateCoachReward(rewardId: string, payload: { name?: string; description?: string | null; pointCost?: number; stock?: number | null; isActive?: boolean }, onSuccess?: () => void): void {
    this.api
      .updateReward(rewardId, payload)
      .pipe(catchError((err: unknown) => {
        this.notifications.error(this.httpError.getMessage(err, 'No se pudo actualizar la recompensa.'));
        return EMPTY;
      }))
      .subscribe((updated) => {
        this.coachRewards.update((list) => list.map((r) => (r.id === rewardId ? updated : r)));
        this.notifications.success('Recompensa actualizada.');
        onSuccess?.();
      });
  }

  deactivateCoachReward(rewardId: string): void {
    this.api
      .deactivateReward(rewardId)
      .pipe(catchError((err: unknown) => {
        this.notifications.error(this.httpError.getMessage(err, 'No se pudo desactivar la recompensa.'));
        return EMPTY;
      }))
      .subscribe(() => {
        this.coachRewards.update((list) => list.map((r) => (r.id === rewardId ? { ...r, isActive: false } : r)));
        this.notifications.info('Recompensa desactivada.');
      });
  }

  loadCoachRedemptions(status?: string): void {
    this.loadingCoachRedemptions.set(true);
    this.api
      .getCoachRedemptions(status)
      .pipe(catchError(() => { this.loadingCoachRedemptions.set(false); return EMPTY; }))
      .subscribe((data) => { this.coachRedemptions.set(data); this.loadingCoachRedemptions.set(false); });
  }

  deliverRedemption(redemptionId: string, notes?: string): void {
    this.api
      .deliverRedemption(redemptionId, notes)
      .pipe(catchError((err: unknown) => {
        this.notifications.error(this.httpError.getMessage(err, 'No se pudo marcar como entregado.'));
        return EMPTY;
      }))
      .subscribe((updated) => {
        this.coachRedemptions.update((list) => list.map((r) => (r.id === redemptionId ? updated : r)));
        this.notifications.success('Canje marcado como entregado.');
      });
  }

  cancelRedemption(redemptionId: string): void {
    this.api
      .cancelRedemption(redemptionId)
      .pipe(catchError((err: unknown) => {
        this.notifications.error(this.httpError.getMessage(err, 'No se pudo cancelar el canje.'));
        return EMPTY;
      }))
      .subscribe((updated) => {
        this.coachRedemptions.update((list) => list.map((r) => (r.id === redemptionId ? updated : r)));
        this.notifications.info('Canje cancelado.');
      });
  }
}

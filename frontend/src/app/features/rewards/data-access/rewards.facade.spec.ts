import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorService } from '@core/services/http-error.service';
import { NotificationService } from '@core/services/notification.service';
import { RewardsApiService } from '@core/services/data-access/rewards-api.service';
import { RewardsFacade } from './rewards.facade';

describe('RewardsFacade', () => {
  let facade: RewardsFacade;
  let api: {
    listActiveRewards: jest.Mock;
    getPointsBalance: jest.Mock;
    getMyRedemptions: jest.Mock;
    redeemReward: jest.Mock;
    getCoachRewards: jest.Mock;
    createReward: jest.Mock;
    updateReward: jest.Mock;
    deactivateReward: jest.Mock;
    getCoachRedemptions: jest.Mock;
    deliverRedemption: jest.Mock;
    cancelRedemption: jest.Mock;
  };
  let httpError: { getMessage: jest.Mock };
  let notifications: { success: jest.Mock; error: jest.Mock; info: jest.Mock };

  beforeEach(() => {
    api = {
      listActiveRewards: jest.fn(() => of([{ id: 'r1' }])),
      getPointsBalance: jest.fn(() => of({ weeklyAvailablePoints: 100 })),
      getMyRedemptions: jest.fn(() => of([{ id: 'x1' }])),
      redeemReward: jest.fn(() => of({ id: 'x2' })),
      getCoachRewards: jest.fn(() => of([{ id: 'cr1', isActive: true }])),
      createReward: jest.fn(() => of({ id: 'cr2' })),
      updateReward: jest.fn(() => of({ id: 'cr1', name: 'updated' })),
      deactivateReward: jest.fn(() => of(void 0)),
      getCoachRedemptions: jest.fn(() => of([{ id: 'rx1' }])),
      deliverRedemption: jest.fn(() => of({ id: 'rx1', status: 'delivered' })),
      cancelRedemption: jest.fn(() => of({ id: 'rx1', status: 'cancelled' })),
    };
    httpError = {
      getMessage: jest.fn(() => 'mensaje'),
    };
    notifications = {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        RewardsFacade,
        { provide: RewardsApiService, useValue: api },
        { provide: HttpErrorService, useValue: httpError },
        { provide: NotificationService, useValue: notifications },
      ],
    });

    facade = TestBed.inject(RewardsFacade);
  });

  it('loads player rewards and balance', () => {
    facade.loadRewards();
    facade.loadPointsBalance();
    expect(facade.rewards()).toEqual([{ id: 'r1' } as never]);
    expect(facade.pointsBalance()).toEqual({ weeklyAvailablePoints: 100 } as never);
    expect(facade.loadingRewards()).toBe(false);
  });

  it('handles loadRewards error', () => {
    api.listActiveRewards.mockReturnValue(throwError(() => new Error('boom')));
    facade.loadRewards();
    expect(facade.rewardsError()).toBe('mensaje');
  });

  it('loads and prepends redemption on redeem success', () => {
    facade.myRedemptions.set([{ id: 'old' } as never]);
    facade.redeemReward('r1');
    expect(api.redeemReward).toHaveBeenCalledWith('r1');
    expect(facade.myRedemptions().map((x) => x.id)).toEqual(['x2', 'old']);
    expect(notifications.success).toHaveBeenCalled();
    expect(api.listActiveRewards).toHaveBeenCalled();
    expect(api.getPointsBalance).toHaveBeenCalled();
    expect(facade.redeeming()).toBe(false);
  });

  it('does nothing if redeemReward is called while already redeeming', () => {
    facade.redeeming.set(true);
    facade.redeemReward('r1');
    expect(api.redeemReward).not.toHaveBeenCalled();
  });

  it('handles redeem error', () => {
    api.redeemReward.mockReturnValue(throwError(() => new Error('boom')));
    facade.redeemReward('r1');
    expect(notifications.error).toHaveBeenCalledWith('mensaje');
    expect(facade.redeeming()).toBe(false);
  });

  it('ignores loadPointsBalance error without breaking state', () => {
    api.getPointsBalance.mockReturnValue(throwError(() => new Error('boom')));
    facade.pointsBalance.set({ weeklyAvailablePoints: 123 } as never);
    facade.loadPointsBalance();
    expect(facade.pointsBalance()).toEqual({ weeklyAvailablePoints: 123 } as never);
  });

  it('handles loadMyRedemptions error and resets loading flag', () => {
    api.getMyRedemptions.mockReturnValue(throwError(() => new Error('boom')));
    facade.loadMyRedemptions();
    expect(facade.loadingMyRedemptions()).toBe(false);
  });

  it('loads coach rewards/redemptions', () => {
    facade.loadCoachRewards();
    facade.loadCoachRedemptions('pending');
    expect(api.getCoachRewards).toHaveBeenCalled();
    expect(api.getCoachRedemptions).toHaveBeenCalledWith('pending');
    expect(facade.coachRewards()).toEqual([{ id: 'cr1', isActive: true } as never]);
    expect(facade.coachRedemptions()).toEqual([{ id: 'rx1' } as never]);
    expect(facade.loadingCoachRewards()).toBe(false);
    expect(facade.loadingCoachRedemptions()).toBe(false);
  });

  it('handles coach loading errors and resets loading flags', () => {
    api.getCoachRewards.mockReturnValue(throwError(() => new Error('boom')));
    api.getCoachRedemptions.mockReturnValue(throwError(() => new Error('boom')));
    facade.loadCoachRewards();
    facade.loadCoachRedemptions();
    expect(facade.loadingCoachRewards()).toBe(false);
    expect(facade.loadingCoachRedemptions()).toBe(false);
  });

  it('creates, updates and deactivates coach reward', () => {
    const onSuccess = jest.fn();
    facade.coachRewards.set([{ id: 'cr1', isActive: true } as never]);

    facade.createCoachReward({ name: 'A', pointCost: 100 }, onSuccess);
    expect(facade.coachRewards()[0].id).toBe('cr2');
    expect(notifications.success).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();

    facade.updateCoachReward('cr1', { name: 'B' }, onSuccess);
    expect(notifications.success).toHaveBeenCalled();

    facade.deactivateCoachReward('cr1');
    expect(notifications.info).toHaveBeenCalled();
  });

  it('handles coach reward update errors', () => {
    api.createReward.mockReturnValue(throwError(() => new Error('boom')));
    api.updateReward.mockReturnValue(throwError(() => new Error('boom')));
    api.deactivateReward.mockReturnValue(throwError(() => new Error('boom')));

    facade.createCoachReward({ name: 'A', pointCost: 100 });
    facade.updateCoachReward('cr1', { name: 'B' });
    facade.deactivateCoachReward('cr1');

    expect(notifications.error).toHaveBeenCalled();
  });

  it('delivers and cancels redemptions', () => {
    facade.coachRedemptions.set([{ id: 'rx1', status: 'pending' } as never]);
    facade.deliverRedemption('rx1', 'done');
    facade.cancelRedemption('rx1');
    expect(api.deliverRedemption).toHaveBeenCalledWith('rx1', 'done');
    expect(api.cancelRedemption).toHaveBeenCalledWith('rx1');
    expect(notifications.success).toHaveBeenCalled();
    expect(notifications.info).toHaveBeenCalled();
  });

  it('handles deliver/cancel redemption errors', () => {
    api.deliverRedemption.mockReturnValue(throwError(() => new Error('boom')));
    api.cancelRedemption.mockReturnValue(throwError(() => new Error('boom')));
    facade.deliverRedemption('rx1');
    facade.cancelRedemption('rx1');
    expect(notifications.error).toHaveBeenCalledWith('mensaje');
  });
});

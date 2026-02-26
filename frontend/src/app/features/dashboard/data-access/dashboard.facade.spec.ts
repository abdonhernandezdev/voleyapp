import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AchievementsApiService } from '@core/services/data-access/achievements-api.service';
import { CoachApiService } from '@core/services/data-access/coach-api.service';
import { GameSessionsApiService } from '@core/services/data-access/game-sessions-api.service';
import { RankingsApiService } from '@core/services/data-access/rankings-api.service';
import { RewardsApiService } from '@core/services/data-access/rewards-api.service';
import { ScoringApiService } from '@core/services/data-access/scoring-api.service';
import { AuthService } from '@core/services/auth.service';
import { DashboardFacade } from './dashboard.facade';

describe('DashboardFacade', () => {
  let facade: DashboardFacade;
  let auth: { refreshUser: jest.Mock };
  let rankingsApi: { getMyPosition: jest.Mock };
  let gameSessionsApi: { getMySessions: jest.Mock };
  let achievementsApi: { getMine: jest.Mock };
  let scoringApi: { getMyDailyStatus: jest.Mock };
  let rewardsApi: { listActiveRewards: jest.Mock; getPointsBalance: jest.Mock };
  let coachApi: { getMyAssignments: jest.Mock };

  beforeEach(() => {
    auth = { refreshUser: jest.fn(() => of({})) };
    rankingsApi = { getMyPosition: jest.fn(() => of({ position: 3 })) };
    gameSessionsApi = { getMySessions: jest.fn(() => of([{ id: 's1' }])) };
    achievementsApi = { getMine: jest.fn(() => of([{ id: 'a1' }])) };
    scoringApi = { getMyDailyStatus: jest.fn(() => of({ general: [{ game: 'quiz' }], individual: [] })) };
    rewardsApi = {
      listActiveRewards: jest.fn(() => of([{ id: 'r1' }])),
      getPointsBalance: jest.fn(() => of({ weeklyAvailablePoints: 10 })),
    };
    coachApi = {
      getMyAssignments: jest.fn(() =>
        of([
          { id: 'new', createdAt: new Date().toISOString() },
          { id: 'old', createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
          { id: 'invalid', createdAt: 'bad-date' },
        ]),
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        DashboardFacade,
        { provide: AuthService, useValue: auth },
        { provide: RankingsApiService, useValue: rankingsApi },
        { provide: GameSessionsApiService, useValue: gameSessionsApi },
        { provide: AchievementsApiService, useValue: achievementsApi },
        { provide: ScoringApiService, useValue: scoringApi },
        { provide: RewardsApiService, useValue: rewardsApi },
        { provide: CoachApiService, useValue: coachApi },
      ],
    });

    facade = TestBed.inject(DashboardFacade);
  });

  it('loads dashboard data and filters assignments older than one week', () => {
    facade.loadDashboard();

    expect(auth.refreshUser).toHaveBeenCalled();
    expect(rankingsApi.getMyPosition).toHaveBeenCalled();
    expect(gameSessionsApi.getMySessions).toHaveBeenCalledWith(5);
    expect(facade.position()).toBe(3);
    expect(facade.recentSessions()).toEqual([{ id: 's1' } as never]);
    expect(facade.achievements()).toEqual([{ id: 'a1' } as never]);
    expect(facade.generalScoringStatus()).toEqual([{ game: 'quiz' } as never]);
    expect(facade.rewards()).toEqual([{ id: 'r1' } as never]);
    expect(facade.rewardPointsBalance()).toEqual({ weeklyAvailablePoints: 10 } as never);
    expect(facade.playerAssignments().map((x) => x.id)).toEqual(['new', 'invalid']);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  it('uses fallback values when one or more API calls fail', () => {
    rankingsApi.getMyPosition.mockReturnValue(throwError(() => new Error('boom')));
    gameSessionsApi.getMySessions.mockReturnValue(throwError(() => new Error('boom')));
    achievementsApi.getMine.mockReturnValue(throwError(() => new Error('boom')));
    scoringApi.getMyDailyStatus.mockReturnValue(throwError(() => new Error('boom')));
    rewardsApi.listActiveRewards.mockReturnValue(throwError(() => new Error('boom')));
    rewardsApi.getPointsBalance.mockReturnValue(throwError(() => new Error('boom')));
    coachApi.getMyAssignments.mockReturnValue(throwError(() => new Error('boom')));
    facade.loadDashboard();
    expect(facade.loading()).toBe(false);
    expect(facade.position()).toBeNull();
    expect(facade.recentSessions()).toEqual([]);
    expect(facade.achievements()).toEqual([]);
    expect(facade.generalScoringStatus()).toEqual([]);
    expect(facade.rewards()).toEqual([]);
    expect(facade.rewardPointsBalance()).toBeNull();
    expect(facade.playerAssignments()).toEqual([]);
    expect(facade.error()).toBeNull();
  });
});

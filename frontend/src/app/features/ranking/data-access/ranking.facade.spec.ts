import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RankingsApiService } from '@core/services/data-access/rankings-api.service';
import { RankingFacade } from './ranking.facade';

describe('RankingFacade', () => {
  let facade: RankingFacade;
  let api: { getRanking: jest.Mock; getMyPosition: jest.Mock };

  beforeEach(() => {
    api = {
      getRanking: jest.fn(),
      getMyPosition: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [RankingFacade, { provide: RankingsApiService, useValue: api }],
    });
    facade = TestBed.inject(RankingFacade);
  });

  it('loads ranking and own position', () => {
    api.getRanking.mockReturnValue(of([{ id: 'u1' }]));
    api.getMyPosition.mockReturnValue(of({ position: 1 }));

    facade.loadRanking();

    expect(api.getRanking).toHaveBeenCalledWith('weekly');
    expect(api.getMyPosition).toHaveBeenCalledWith('weekly');
    expect(facade.ranking()).toEqual([{ id: 'u1' } as never]);
    expect(facade.myPosition()).toEqual({ position: 1 } as never);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  it('setMode does nothing if mode is unchanged', () => {
    const spy = jest.spyOn(facade, 'loadRanking');
    facade.setMode('weekly');
    expect(spy).not.toHaveBeenCalled();
  });

  it('setMode changes mode and reloads data', () => {
    api.getRanking.mockReturnValue(of([]));
    api.getMyPosition.mockReturnValue(of(null));
    const spy = jest.spyOn(facade, 'loadRanking');
    facade.setMode('global');
    expect(facade.mode()).toBe('global');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('applies fallback values when API calls fail', () => {
    api.getRanking.mockReturnValue(throwError(() => new Error('boom')));
    api.getMyPosition.mockReturnValue(throwError(() => new Error('boom')));
    facade.loadRanking();
    expect(facade.loading()).toBe(false);
    expect(facade.ranking()).toEqual([]);
    expect(facade.myPosition()).toBeNull();
    expect(facade.error()).toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { FormationConfigApiService } from '@core/services/data-access/formation-config-api.service';
import { TrainingApiService } from '@core/services/data-access/training-api.service';
import { RotationSimFacade } from './rotation-sim.facade';

describe('RotationSimFacade', () => {
  let facade: RotationSimFacade;
  const trainingApi = {
    checkRotationRound: jest.fn(() => of({})),
    completeTrainingGame: jest.fn(() => of({})),
  };
  const formationApi = {
    getGameStatus: jest.fn(() => of({ configured: true })),
  };
  const auth = {
    refreshUser: jest.fn(() => of({})),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RotationSimFacade,
        { provide: TrainingApiService, useValue: trainingApi },
        { provide: FormationConfigApiService, useValue: formationApi },
        { provide: AuthService, useValue: auth },
      ],
    });
    facade = TestBed.inject(RotationSimFacade);
  });

  it('loads config by game key', () => {
    facade.loadConfig('reception_5_1').subscribe();
    expect(formationApi.getGameStatus).toHaveBeenCalledWith('reception_5_1');
  });

  it('checks rotation round', () => {
    const dto = { round: 1, placements: [] };
    facade.checkRotationRound(dto as never).subscribe();
    expect(trainingApi.checkRotationRound).toHaveBeenCalledWith(dto);
  });

  it('completes game and refreshes user', () => {
    const dto = { game: 'reception_5_1' };
    facade.completeGame(dto as never).subscribe();
    facade.refreshUser().subscribe();
    expect(trainingApi.completeTrainingGame).toHaveBeenCalledWith(dto);
    expect(auth.refreshUser).toHaveBeenCalled();
  });
});


import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { FormationConfigApiService } from '@core/services/data-access/formation-config-api.service';
import { TrainingApiService } from '@core/services/data-access/training-api.service';
import { FieldChallengeFacade } from './field-challenge.facade';

describe('FieldChallengeFacade', () => {
  let facade: FieldChallengeFacade;
  const trainingApi = {
    checkDefenseZone: jest.fn(() => of({})),
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
        FieldChallengeFacade,
        { provide: TrainingApiService, useValue: trainingApi },
        { provide: FormationConfigApiService, useValue: formationApi },
        { provide: AuthService, useValue: auth },
      ],
    });
    facade = TestBed.inject(FieldChallengeFacade);
  });

  it('loads defense config', () => {
    facade.loadConfig().subscribe();
    expect(formationApi.getGameStatus).toHaveBeenCalledWith('defense');
  });

  it('checks defense zone', () => {
    const dto = { scenarioIndex: 0, placements: [] };
    facade.checkDefenseZone(dto as never).subscribe();
    expect(trainingApi.checkDefenseZone).toHaveBeenCalledWith(dto);
  });

  it('completes game and refreshes user', () => {
    const dto = { game: 'defense_zone' };
    facade.completeGame(dto as never).subscribe();
    facade.refreshUser().subscribe();
    expect(trainingApi.completeTrainingGame).toHaveBeenCalledWith(dto);
    expect(auth.refreshUser).toHaveBeenCalled();
  });
});


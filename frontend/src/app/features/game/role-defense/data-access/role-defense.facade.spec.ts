import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { FormationConfigApiService } from '@core/services/data-access/formation-config-api.service';
import { TrainingApiService } from '@core/services/data-access/training-api.service';
import { RoleDefenseFacade } from './role-defense.facade';

describe('RoleDefenseFacade', () => {
  let facade: RoleDefenseFacade;
  const trainingApi = {
    checkRoleDefense: jest.fn(() => of({})),
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
        RoleDefenseFacade,
        { provide: TrainingApiService, useValue: trainingApi },
        { provide: FormationConfigApiService, useValue: formationApi },
        { provide: AuthService, useValue: auth },
      ],
    });
    facade = TestBed.inject(RoleDefenseFacade);
  });

  it('loads defense config', () => {
    facade.loadConfig().subscribe();
    expect(formationApi.getGameStatus).toHaveBeenCalledWith('defense');
  });

  it('checks role defense', () => {
    const dto = { scenarioIndex: 1, role: 'Central', x: 10, y: 20 };
    facade.checkRoleDefense(dto as never).subscribe();
    expect(trainingApi.checkRoleDefense).toHaveBeenCalledWith(dto);
  });

  it('completes game and refreshes user', () => {
    const dto = { game: 'role_defense' };
    facade.completeGame(dto as never).subscribe();
    facade.refreshUser().subscribe();
    expect(trainingApi.completeTrainingGame).toHaveBeenCalledWith(dto);
    expect(auth.refreshUser).toHaveBeenCalled();
  });
});


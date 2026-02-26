import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { FormationConfigApiService } from '@core/services/data-access/formation-config-api.service';
import { TrainingApiService } from '@core/services/data-access/training-api.service';
import { RoleReceptionFacade } from './role-reception.facade';

describe('RoleReceptionFacade', () => {
  let facade: RoleReceptionFacade;
  const trainingApi = {
    checkRoleReception: jest.fn(() => of({})),
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
        RoleReceptionFacade,
        { provide: TrainingApiService, useValue: trainingApi },
        { provide: FormationConfigApiService, useValue: formationApi },
        { provide: AuthService, useValue: auth },
      ],
    });
    facade = TestBed.inject(RoleReceptionFacade);
  });

  it('loads reception_5_1 config', () => {
    facade.loadConfig().subscribe();
    expect(formationApi.getGameStatus).toHaveBeenCalledWith('reception_5_1');
  });

  it('checks role reception', () => {
    const dto = { round: 1, role: 'Receptor', x: 10, y: 20 };
    facade.checkRoleReception(dto as never).subscribe();
    expect(trainingApi.checkRoleReception).toHaveBeenCalledWith(dto);
  });

  it('completes game and refreshes user', () => {
    const dto = { game: 'role_reception' };
    facade.completeGame(dto as never).subscribe();
    facade.refreshUser().subscribe();
    expect(trainingApi.completeTrainingGame).toHaveBeenCalledWith(dto);
    expect(auth.refreshUser).toHaveBeenCalled();
  });
});


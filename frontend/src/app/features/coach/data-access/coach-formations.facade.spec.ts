import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FormationConfigApiService } from '@core/services/data-access/formation-config-api.service';
import { CoachFormationsFacade } from './coach-formations.facade';

describe('CoachFormationsFacade', () => {
  let facade: CoachFormationsFacade;
  const api = {
    getAllStatus: jest.fn(() => of({})),
    getRotationZones: jest.fn(() => of([])),
    saveRotationZones: jest.fn(() => of(void 0)),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CoachFormationsFacade, { provide: FormationConfigApiService, useValue: api }],
    });
    facade = TestBed.inject(CoachFormationsFacade);
  });

  it('delegates getAllStatus', () => {
    facade.getAllStatus().subscribe();
    expect(api.getAllStatus).toHaveBeenCalled();
  });

  it('delegates getRotationZones', () => {
    facade.getRotationZones('reception', '5-1', 2).subscribe();
    expect(api.getRotationZones).toHaveBeenCalledWith('reception', '5-1', 2);
  });

  it('delegates saveRotationZones', () => {
    const zones = [{ playerId: 1, x: 10, y: 20, w: 10, h: 15 }];
    facade.saveRotationZones('defense', null, 1, zones).subscribe();
    expect(api.saveRotationZones).toHaveBeenCalledWith('defense', null, 1, zones);
  });
});


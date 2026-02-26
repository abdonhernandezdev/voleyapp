import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FormationConfigApiService } from './formation-config-api.service';

describe('FormationConfigApiService', () => {
  let service: FormationConfigApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), FormationConfigApiService],
    });
    service = TestBed.inject(FormationConfigApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('calls getAllStatus', () => {
    service.getAllStatus().subscribe();
    const req = httpMock.expectOne('/api/coach/formation-config/status');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('calls getRotationZones with explicit system', () => {
    service.getRotationZones('reception', '5-1', 2).subscribe();
    const req = httpMock.expectOne('/api/coach/formation-config/reception/5-1/2');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('calls getRotationZones with null system as "null"', () => {
    service.getRotationZones('defense', null, 1).subscribe();
    const req = httpMock.expectOne('/api/coach/formation-config/defense/null/1');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('calls saveRotationZones', () => {
    const zones = [{ playerId: 1, x: 1, y: 1, w: 10, h: 10 }];
    service.saveRotationZones('defense', null, 0, zones).subscribe();
    const req = httpMock.expectOne('/api/coach/formation-config/defense/null/0');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ zones });
    req.flush(null);
  });

  it('calls getGameStatus', () => {
    service.getGameStatus('reception_5_1').subscribe();
    const req = httpMock.expectOne('/api/training/formation-status/reception_5_1');
    expect(req.request.method).toBe('GET');
    req.flush({ configured: true });
  });
});


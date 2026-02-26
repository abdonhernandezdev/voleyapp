import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { TrainingApiService } from './training-api.service';

describe('TrainingApiService', () => {
  let service: TrainingApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TrainingApiService],
    });
    service = TestBed.inject(TrainingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('checks rotation round', () => {
    const payload = { round: 0, placements: [] };
    service.checkRotationRound(payload as never).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/training/rotation/check`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('checks defense zone', () => {
    const payload = { scenarioIndex: 0, placements: [] };
    service.checkDefenseZone(payload as never).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/training/defense-zone/check`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('checks role reception and role defense', () => {
    service.checkRoleReception({ round: 0, role: 'Receptor 1', x: 10, y: 10 } as never).subscribe();
    let req = httpMock.expectOne(`${environment.apiUrl}/training/role-reception/check`);
    expect(req.request.method).toBe('POST');
    req.flush({});

    service.checkRoleDefense({ scenarioIndex: 0, role: 'Receptor 1', x: 10, y: 10 } as never).subscribe();
    req = httpMock.expectOne(`${environment.apiUrl}/training/role-defense/check`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('completes training game', () => {
    const payload = { game: 'quiz', rawPoints: 100, correctAnswers: 5, totalQuestions: 10 };
    service.completeTrainingGame(payload as never).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/training/complete`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });
});


import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { GameSessionsApiService } from './game-sessions-api.service';

describe('GameSessionsApiService', () => {
  let service: GameSessionsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), GameSessionsApiService],
    });
    service = TestBed.inject(GameSessionsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('startSession posts mode/category', () => {
    service.startSession('category', 'game_systems').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/game-sessions/start`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ mode: 'category', category: 'game_systems' });
    req.flush({});
  });

  it('submitAnswer posts answer payload', () => {
    service.submitAnswer('s1', 'q1', 2, 11).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/game-sessions/s1/answer`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      questionId: 'q1',
      answer: { selectedOptionIndex: 2, timeSeconds: 11 },
    });
    req.flush({});
  });

  it('completeSession patches total time', () => {
    service.completeSession('s1', 99).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/game-sessions/s1/complete`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ totalTimeSpentSeconds: 99 });
    req.flush({});
  });

  it('getMySessions sends limit param', () => {
    service.getMySessions(5).subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === `${environment.apiUrl}/game-sessions/my-sessions` &&
      r.params.get('limit') === '5',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getMySessions uses default limit=10', () => {
    service.getMySessions().subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === `${environment.apiUrl}/game-sessions/my-sessions` &&
      r.params.get('limit') === '10',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getMyStats uses my-stats endpoint', () => {
    service.getMyStats().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/game-sessions/my-stats`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});

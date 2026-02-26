import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { QuestionsApiService } from './questions-api.service';

describe('QuestionsApiService', () => {
  let service: QuestionsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), QuestionsApiService],
    });
    service = TestBed.inject(QuestionsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getQuestions without category', () => {
    service.getQuestions().subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === `${environment.apiUrl}/questions` && r.params.keys().length === 0,
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getQuestions with category', () => {
    service.getQuestions('game_systems').subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === `${environment.apiUrl}/questions` && r.params.get('category') === 'game_systems',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getRandomQuestions with default limit', () => {
    service.getRandomQuestions().subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === `${environment.apiUrl}/questions/random` &&
      r.params.get('limit') === '10' &&
      !r.params.has('category'),
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getRandomQuestions with category and custom limit', () => {
    service.getRandomQuestions('positions_roles', 7).subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === `${environment.apiUrl}/questions/random` &&
      r.params.get('limit') === '7' &&
      r.params.get('category') === 'positions_roles',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});


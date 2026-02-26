import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { ScoringApiService } from './scoring-api.service';

describe('ScoringApiService', () => {
  let service: ScoringApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ScoringApiService],
    });
    service = TestBed.inject(ScoringApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('gets daily status', () => {
    service.getMyDailyStatus().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/scoring/my-daily-status`);
    expect(req.request.method).toBe('GET');
    req.flush({ general: [], individual: [] });
  });
});


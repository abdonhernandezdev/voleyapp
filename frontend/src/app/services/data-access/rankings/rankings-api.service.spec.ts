import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { RankingsApiService } from './rankings-api.service';

describe('RankingsApiService', () => {
  let service: RankingsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), RankingsApiService],
    });
    service = TestBed.inject(RankingsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('gets weekly ranking by default', () => {
    service.getRanking().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/rankings?mode=weekly`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('gets global ranking when requested', () => {
    service.getRanking('global').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/rankings?mode=global`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('gets own ranking position by mode', () => {
    service.getMyPosition('global').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/rankings/my-position?mode=global`);
    expect(req.request.method).toBe('GET');
    req.flush({ position: 1 });
  });

  it('gets weekly own ranking position by default', () => {
    service.getMyPosition().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/rankings/my-position?mode=weekly`);
    expect(req.request.method).toBe('GET');
    req.flush({ position: 3 });
  });
});

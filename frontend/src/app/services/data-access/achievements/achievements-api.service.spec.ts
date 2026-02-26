import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { AchievementsApiService } from './achievements-api.service';

describe('AchievementsApiService', () => {
  let service: AchievementsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AchievementsApiService],
    });
    service = TestBed.inject(AchievementsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('calls GET /achievements/me', () => {
    service.getMine().subscribe((res) => expect(res).toEqual([{ id: 'a1' }]));
    const req = httpMock.expectOne(`${environment.apiUrl}/achievements/me`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'a1' }]);
  });
});


import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { RewardsApiService } from './rewards-api.service';

describe('RewardsApiService', () => {
  let service: RewardsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), RewardsApiService],
    });
    service = TestBed.inject(RewardsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists active rewards', () => {
    service.listActiveRewards().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/rewards`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('gets balance', () => {
    service.getPointsBalance().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/rewards/balance`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('redeems reward', () => {
    service.redeemReward('r1').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/rewards/r1/redeem`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('gets my redemptions', () => {
    service.getMyRedemptions().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/rewards/my-redemptions`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('gets coach rewards and redemptions', () => {
    service.getCoachRewards().subscribe();
    let req = httpMock.expectOne(`${environment.apiUrl}/coach/rewards`);
    expect(req.request.method).toBe('GET');
    req.flush([]);

    service.getCoachRedemptions().subscribe();
    req = httpMock.expectOne(`${environment.apiUrl}/coach/rewards/redemptions`);
    expect(req.request.method).toBe('GET');
    req.flush([]);

    service.getCoachRedemptions('pending').subscribe();
    req = httpMock.expectOne(`${environment.apiUrl}/coach/rewards/redemptions?status=pending`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('creates, updates and deactivates rewards', () => {
    service.createReward({ name: 'A', pointCost: 100 }).subscribe();
    let req = httpMock.expectOne(`${environment.apiUrl}/coach/rewards`);
    expect(req.request.method).toBe('POST');
    req.flush({});

    service.updateReward('r1', { name: 'B' }).subscribe();
    req = httpMock.expectOne(`${environment.apiUrl}/coach/rewards/r1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    service.deactivateReward('r1').subscribe();
    req = httpMock.expectOne(`${environment.apiUrl}/coach/rewards/r1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('delivers and cancels redemption', () => {
    service.deliverRedemption('x1', 'ok').subscribe();
    let req = httpMock.expectOne(`${environment.apiUrl}/coach/rewards/redemptions/x1/deliver`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ notes: 'ok' });
    req.flush({});

    service.cancelRedemption('x1').subscribe();
    req = httpMock.expectOne(`${environment.apiUrl}/coach/rewards/redemptions/x1/cancel`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush({});
  });
});


import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { User } from '@shared/models/user.model';
import { environment } from '@env/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: { navigate: jest.Mock; createUrlTree: jest.Mock };

  const mockUser: User = {
    id: 'u1',
    username: 'user',
    email: 'user@test.com',
    displayName: 'User',
    avatarEmoji: 'sports_volleyball',
    role: 'player',
    totalPoints: 0,
    gamesPlayed: 0,
    sessionsWon: 0,
    streak: 0,
    maxStreak: 0,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    router = {
      navigate: jest.fn().mockResolvedValue(true),
      createUrlTree: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('register sets session and redirects to dashboard', () => {
    service.register({
      username: 'user',
      email: 'user@test.com',
      password: 'secret',
    }).subscribe((res) => {
      expect(res.user.id).toBe('u1');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush({ user: mockUser });

    expect(service.user()).toEqual(mockUser);
    expect(service.isLoggedIn()).toBe(true);
    expect(service.sessionChecked()).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('login sets session and redirects to dashboard', () => {
    service.login('user@test.com', 'secret').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'user@test.com', password: 'secret' });
    req.flush({ user: mockUser });

    expect(service.user()).toEqual(mockUser);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('ensureSession reuses in-flight request and marks checked', () => {
    let r1: boolean | undefined;
    let r2: boolean | undefined;

    service.ensureSession().subscribe((value) => (r1 = value));
    service.ensureSession().subscribe((value) => (r2 = value));

    const reqs = httpMock.match(`${environment.apiUrl}/auth/me`);
    expect(reqs).toHaveLength(1);
    reqs[0].flush(mockUser);

    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(service.sessionChecked()).toBe(true);
    expect(service.user()).toEqual(mockUser);
  });

  it('ensureSession handles error and returns false', () => {
    let result = true;
    service.ensureSession().subscribe((value) => (result = value));

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(result).toBe(false);
    expect(service.user()).toBeNull();
    expect(service.sessionChecked()).toBe(true);
  });

  it('ensureSession returns cached value after checked', () => {
    service.ensureSession().subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/me`).flush(mockUser);

    let value = false;
    service.ensureSession().subscribe((v) => (value = v));
    expect(value).toBe(true);
    httpMock.expectNone(`${environment.apiUrl}/auth/me`);
  });

  it('refreshUser updates user and checked flags', () => {
    service.refreshUser().subscribe((user) => {
      expect(user.username).toBe('user');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/me`);
    req.flush(mockUser);

    expect(service.user()).toEqual(mockUser);
    expect(service.sessionChecked()).toBe(true);
  });

  it('logout clears session and redirects even on backend error', () => {
    service.login('user@test.com', 'secret').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({ user: mockUser });

    service.logout();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({}, { status: 500, statusText: 'Server Error' });

    expect(service.user()).toBeNull();
    expect(service.sessionChecked()).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('handleUnauthorized clears session and redirects to login', () => {
    service.login('user@test.com', 'secret').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({ user: mockUser });

    service.handleUnauthorized();

    expect(service.user()).toBeNull();
    expect(service.sessionChecked()).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});


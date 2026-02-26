import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('allows navigation when session is valid', async () => {
    const authMock = {
      ensureSession: jest.fn(() => of(true)),
    };
    const routerMock = {
      createUrlTree: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const result$ = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    ) as Observable<unknown>;
    await expect(firstValueFrom(result$)).resolves.toBe(true);
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects to login when session is invalid', async () => {
    const tree = { to: 'login' };
    const authMock = {
      ensureSession: jest.fn(() => of(false)),
    };
    const routerMock = {
      createUrlTree: jest.fn(() => tree),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    const result$ = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    ) as Observable<unknown>;
    await expect(firstValueFrom(result$)).resolves.toBe(tree);
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
  });
});

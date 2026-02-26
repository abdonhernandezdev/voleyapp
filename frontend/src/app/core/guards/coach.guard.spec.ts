import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { coachGuard } from './coach.guard';

describe('coachGuard', () => {
  it('allows navigation for coach users', async () => {
    const authMock = {
      ensureSession: jest.fn(() => of(true)),
      isCoach: jest.fn(() => true),
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
      coachGuard({} as never, {} as never),
    ) as Observable<unknown>;
    await expect(firstValueFrom(result$)).resolves.toBe(true);
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects non-coach users to dashboard', async () => {
    const tree = { to: 'dashboard' };
    const authMock = {
      ensureSession: jest.fn(() => of(true)),
      isCoach: jest.fn(() => false),
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
      coachGuard({} as never, {} as never),
    ) as Observable<unknown>;
    await expect(firstValueFrom(result$)).resolves.toBe(tree);
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});

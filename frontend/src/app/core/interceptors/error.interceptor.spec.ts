import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { HttpErrorService } from '@core/services/http-error.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  function runInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn) {
    return TestBed.runInInjectionContext(() => errorInterceptor(request, next));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { handleUnauthorized: jest.fn() },
        },
        {
          provide: HttpErrorService,
          useValue: { reportGlobal: jest.fn() },
        },
      ],
    });
  });

  it('calls handleUnauthorized for 401 on protected endpoints', (done) => {
    const auth = TestBed.inject(AuthService) as unknown as { handleUnauthorized: jest.Mock };
    const httpError = TestBed.inject(HttpErrorService) as unknown as {
      reportGlobal: jest.Mock;
    };
    const request = new HttpRequest('GET', '/api/protected');
    const next: HttpHandlerFn = () =>
      throwError(() => new HttpErrorResponse({ status: 401, url: '/api/protected' }));

    runInterceptor(request, next).subscribe({
      error: () => {
        expect(auth.handleUnauthorized).toHaveBeenCalledTimes(1);
        expect(httpError.reportGlobal).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('does not call handleUnauthorized for auth endpoints', (done) => {
    const auth = TestBed.inject(AuthService) as unknown as { handleUnauthorized: jest.Mock };
    const request = new HttpRequest('POST', '/api/auth/login', {});
    const next: HttpHandlerFn = () =>
      throwError(() => new HttpErrorResponse({ status: 401, url: '/api/auth/login' }));

    runInterceptor(request, next).subscribe({
      error: () => {
        expect(auth.handleUnauthorized).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('reports global error for network/server failures', (done) => {
    const httpError = TestBed.inject(HttpErrorService) as unknown as {
      reportGlobal: jest.Mock;
    };
    const request = new HttpRequest('GET', '/api/any');
    const next: HttpHandlerFn = () =>
      throwError(() => new HttpErrorResponse({ status: 500, url: '/api/any' }));

    runInterceptor(request, next).subscribe({
      error: () => {
        expect(httpError.reportGlobal).toHaveBeenCalledTimes(1);
        done();
      },
    });
  });

  it('passes through non-http errors', (done) => {
    const auth = TestBed.inject(AuthService) as unknown as { handleUnauthorized: jest.Mock };
    const httpError = TestBed.inject(HttpErrorService) as unknown as {
      reportGlobal: jest.Mock;
    };
    const request = new HttpRequest('GET', '/api/any');
    const next: HttpHandlerFn = () => throwError(() => new Error('boom'));

    runInterceptor(request, next).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(auth.handleUnauthorized).not.toHaveBeenCalled();
        expect(httpError.reportGlobal).not.toHaveBeenCalled();
        done();
      },
    });
  });
});

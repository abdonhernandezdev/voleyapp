import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('adds withCredentials for API requests', async () => {
    const request = new HttpRequest('GET', '/api/users');
    const next: HttpHandlerFn = jest.fn((req) => {
      expect(req.withCredentials).toBe(true);
      return of(new HttpResponse({ status: 200 }));
    });

    const result$ = authInterceptor(request, next);
    await firstValueFrom(result$);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not modify non-api requests', async () => {
    const request = new HttpRequest('GET', 'https://example.com/assets/a.png');
    const next: HttpHandlerFn = jest.fn((req) => {
      expect(req.withCredentials).toBe(false);
      return of(new HttpResponse({ status: 200 }));
    });

    const result$ = authInterceptor(request, next);
    await firstValueFrom(result$);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { HttpErrorService } from '@core/services/http-error.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const httpErrorService = inject(HttpErrorService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (
          error.status === 401 &&
          !req.url.includes('/auth/login') &&
          !req.url.includes('/auth/register') &&
          !req.url.includes('/auth/logout') &&
          !req.url.includes('/auth/me')
        ) {
          auth.handleUnauthorized();
        }

        // Only escalate non-user-correctable failures to global banner.
        if (error.status === 0 || error.status >= 500) {
          httpErrorService.reportGlobal(error);
        }
      }
      return throwError(() => error);
    }),
  );
};

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from '@shared/models/auth.model';
import { User } from '@shared/models/user.model';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _user = signal<User | null>(null);
  private readonly _sessionChecked = signal(false);
  private ensureSessionInFlight: Observable<boolean> | null = null;

  readonly user = this._user.asReadonly();
  readonly sessionChecked = this._sessionChecked.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isCoach = computed(() => this._user()?.role === 'coach');

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data).pipe(
      tap((res) => this.setSession(res.user)),
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const payload: LoginRequest = { email, password };
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(
      tap((res) => this.setSession(res.user)),
    );
  }

  ensureSession(): Observable<boolean> {
    if (this._sessionChecked()) {
      return of(!!this._user());
    }

    if (this.ensureSessionInFlight) {
      return this.ensureSessionInFlight;
    }

    this.ensureSessionInFlight = this.http.get<User | null>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => this._user.set(user)),
      map((user) => !!user),
      catchError(() => {
        this._user.set(null);
        return of(false);
      }),
      finalize(() => {
        this._sessionChecked.set(true);
        this.ensureSessionInFlight = null;
      }),
      shareReplay(1),
    );

    return this.ensureSessionInFlight;
  }

  refreshUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/me`).pipe(
      tap((user) => {
        this._user.set(user);
        this._sessionChecked.set(true);
      }),
    );
  }

  logout(): void {
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {})
      .pipe(finalize(() => this.clearSession(true)))
      .subscribe({
        error: () => {
          // We still clear local state on transport/auth failures.
        },
      });
  }

  handleUnauthorized(): void {
    this.clearSession(true);
  }

  private setSession(user: User): void {
    this._user.set(user);
    this._sessionChecked.set(true);
    this.router.navigate(['/dashboard']);
  }

  private clearSession(redirectToLogin: boolean): void {
    this._user.set(null);
    this._sessionChecked.set(true);
    if (redirectToLogin) {
      this.router.navigate(['/auth/login']);
    }
  }
}

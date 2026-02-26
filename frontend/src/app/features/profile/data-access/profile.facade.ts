import { Injectable, inject, signal } from '@angular/core';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AchievementsApiService } from '@core/services/data-access/achievements-api.service';
import { UsersApiService, UpdateProfilePayload } from '@core/services/data-access/users-api.service';
import { AuthService } from '@core/services/auth.service';
import { Achievement } from '@shared/models/achievement.model';
import { User } from '@shared/models/user.model';

@Injectable()
export class ProfileFacade {
  private readonly usersApi = inject(UsersApiService);
  private readonly achievementsApi = inject(AchievementsApiService);
  private readonly auth = inject(AuthService);

  readonly user = signal<User | null>(null);
  readonly achievements = signal<Achievement[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveMessage = signal<string | null>(null);

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.saveMessage.set(null);

    forkJoin({
      user: this.usersApi.getMe(),
      achievements: this.achievementsApi.getMine().pipe(catchError(() => of([] as Achievement[]))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ user, achievements }) => {
          this.user.set(user);
          this.achievements.set(achievements);
        },
        error: () => {
          this.error.set('No se pudo cargar el perfil.');
        },
      });
  }

  save(payload: UpdateProfilePayload): void {
    this.saving.set(true);
    this.error.set(null);
    this.saveMessage.set(null);

    this.usersApi
      .updateMe(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.auth.refreshUser().subscribe();
          this.saveMessage.set('Perfil actualizado.');
        },
        error: () => {
          this.error.set('No se pudo guardar el perfil.');
        },
      });
  }
}

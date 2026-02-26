import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { User } from '@shared/models/user.model';

export interface UpdateProfilePayload {
  displayName?: string;
  avatarEmoji?: string;
  streakReminderEmailEnabled?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getAllPlayers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`);
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.base}/users/me`);
  }

  updateMe(payload: UpdateProfilePayload): Observable<User> {
    return this.http.patch<User>(`${this.base}/users/me`, payload);
  }
}

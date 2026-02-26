import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Achievement } from '@shared/models/achievement.model';

@Injectable({ providedIn: 'root' })
export class AchievementsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getMine(): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.base}/achievements/me`);
  }
}

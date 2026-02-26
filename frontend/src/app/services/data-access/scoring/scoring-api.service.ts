import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { DailyScoringStatusResponse } from '@shared/models/scoring.model';

@Injectable({ providedIn: 'root' })
export class ScoringApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getMyDailyStatus(): Observable<DailyScoringStatusResponse> {
    return this.http.get<DailyScoringStatusResponse>(`${this.base}/scoring/my-daily-status`);
  }
}


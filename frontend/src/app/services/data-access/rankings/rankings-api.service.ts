import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { RankingEntry, RankingMode, RankingPosition } from '@shared/models/ranking.model';

@Injectable({ providedIn: 'root' })
export class RankingsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getRanking(mode: RankingMode = 'weekly'): Observable<RankingEntry[]> {
    return this.http.get<RankingEntry[]>(`${this.base}/rankings?mode=${mode}`);
  }

  getMyPosition(mode: RankingMode = 'weekly'): Observable<RankingPosition> {
    return this.http.get<RankingPosition>(`${this.base}/rankings/my-position?mode=${mode}`);
  }
}

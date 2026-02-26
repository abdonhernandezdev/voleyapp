import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  AnswerResult,
  GameMode,
  GameSession,
  SessionStartResponse,
  UserStats,
} from '@shared/models/game-session.model';
import { QuestionCategory } from '@shared/models/question.model';

@Injectable({ providedIn: 'root' })
export class GameSessionsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  startSession(mode: GameMode, category?: QuestionCategory): Observable<SessionStartResponse> {
    return this.http.post<SessionStartResponse>(`${this.base}/game-sessions/start`, { mode, category });
  }

  submitAnswer(sessionId: string, questionId: string, selectedOptionIndex: number, timeSeconds: number): Observable<AnswerResult> {
    return this.http.post<AnswerResult>(`${this.base}/game-sessions/${sessionId}/answer`, {
      questionId,
      answer: { selectedOptionIndex, timeSeconds },
    });
  }

  completeSession(sessionId: string, totalTimeSpentSeconds: number): Observable<GameSession> {
    return this.http.patch<GameSession>(`${this.base}/game-sessions/${sessionId}/complete`, {
      totalTimeSpentSeconds,
    });
  }

  getMySessions(limit = 10): Observable<GameSession[]> {
    return this.http.get<GameSession[]>(`${this.base}/game-sessions/my-sessions`, {
      params: new HttpParams().set('limit', limit.toString()),
    });
  }

  /**
   * Devuelve las estadísticas del usuario autenticado (via JWT).
   * El backend identifica al usuario por el token, no por parámetro.
   */
  getMyStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.base}/game-sessions/my-stats`);
  }
}

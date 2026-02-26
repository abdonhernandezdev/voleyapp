import { Injectable, inject } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { GameSessionsApiService } from '@core/services/data-access/game-sessions-api.service';
import { Achievement } from '@shared/models/achievement.model';
import {
  AnswerResult,
  GameMode,
  SessionScoringSummary,
  SessionStartResponse,
} from '@shared/models/game-session.model';
import { QuestionCategory } from '@shared/models/question.model';

@Injectable({ providedIn: 'root' })
export class QuizFacade {
  private readonly gameSessionsApi = inject(GameSessionsApiService);
  private readonly auth = inject(AuthService);

  startSession(category?: QuestionCategory): Observable<SessionStartResponse> {
    const mode: GameMode = category ? 'category' : 'quick';
    return this.gameSessionsApi.startSession(mode, category);
  }

  submitAnswer(
    sessionId: string,
    questionId: string,
    selectedOptionIndex: number,
    timeSeconds: number,
  ): Observable<AnswerResult> {
    return this.gameSessionsApi.submitAnswer(sessionId, questionId, selectedOptionIndex, timeSeconds);
  }

  completeSession(
    sessionId: string,
    totalTimeSeconds: number,
  ): Observable<{ achievements: Achievement[]; scoring?: SessionScoringSummary }> {
    return this.gameSessionsApi.completeSession(sessionId, totalTimeSeconds).pipe(
      switchMap((session) =>
        this.auth.refreshUser().pipe(
          map(() => ({
            achievements: session.unlockedAchievements ?? [],
            scoring: session.scoring,
          })),
        ),
      ),
    );
  }
}

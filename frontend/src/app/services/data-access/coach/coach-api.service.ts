import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  CoachAssignment,
  CoachManagedQuestion,
  PlayerAssignment,
  CoachPlayerAnalytics,
  CreateCoachAssignmentPayload,
  CreateCoachQuestionPayload,
  UpdateCoachAssignmentPayload,
  UpdateCoachQuestionPayload,
} from '@shared/models/coach.model';
import { User } from '@shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class CoachApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getPlayers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/coach/players`);
  }

  getQuestions(includeInactive = false): Observable<CoachManagedQuestion[]> {
    const params = new HttpParams().set('includeInactive', String(includeInactive));
    return this.http.get<CoachManagedQuestion[]>(`${this.base}/coach/questions`, { params });
  }

  createQuestion(payload: CreateCoachQuestionPayload): Observable<CoachManagedQuestion> {
    return this.http.post<CoachManagedQuestion>(`${this.base}/coach/questions`, payload);
  }

  updateQuestion(
    questionId: string,
    payload: UpdateCoachQuestionPayload,
  ): Observable<CoachManagedQuestion> {
    return this.http.patch<CoachManagedQuestion>(`${this.base}/coach/questions/${questionId}`, payload);
  }

  deleteQuestion(questionId: string): Observable<{ ok: true }> {
    return this.http.delete<{ ok: true }>(`${this.base}/coach/questions/${questionId}`);
  }

  deleteQuestionPermanently(questionId: string): Observable<{ ok: true }> {
    return this.http.delete<{ ok: true }>(`${this.base}/coach/questions/${questionId}/permanent`);
  }

  getAssignments(): Observable<CoachAssignment[]> {
    return this.http.get<CoachAssignment[]>(`${this.base}/coach/assignments`);
  }

  createAssignment(payload: CreateCoachAssignmentPayload): Observable<CoachAssignment> {
    return this.http.post<CoachAssignment>(`${this.base}/coach/assignments`, payload);
  }

  updateAssignment(
    assignmentId: string,
    payload: UpdateCoachAssignmentPayload,
  ): Observable<CoachAssignment> {
    return this.http.patch<CoachAssignment>(`${this.base}/coach/assignments/${assignmentId}`, payload);
  }

  deleteAssignment(assignmentId: string): Observable<{ ok: true }> {
    return this.http.delete<{ ok: true }>(`${this.base}/coach/assignments/${assignmentId}`);
  }

  getAssignmentProgress(assignmentId: string): Observable<CoachAssignment> {
    return this.http.get<CoachAssignment>(`${this.base}/coach/assignments/${assignmentId}/progress`);
  }

  getMyAssignments(): Observable<PlayerAssignment[]> {
    return this.http.get<PlayerAssignment[]>(`${this.base}/assignments/my`);
  }

  getPlayerAnalytics(playerId: string, weeks = 8): Observable<CoachPlayerAnalytics> {
    const params = new HttpParams().set('weeks', String(weeks));
    return this.http.get<CoachPlayerAnalytics>(`${this.base}/coach/players/${playerId}/analytics`, { params });
  }

  exportPlayerReport(playerId: string): Observable<Blob> {
    return this.http.get(`${this.base}/coach/players/${playerId}/report`, {
      responseType: 'blob',
    });
  }
}

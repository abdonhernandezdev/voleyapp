import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Question, QuestionCategory } from '@shared/models/question.model';

@Injectable({ providedIn: 'root' })
export class QuestionsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getQuestions(category?: QuestionCategory): Observable<Question[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<Question[]>(`${this.base}/questions`, { params });
  }

  getRandomQuestions(category?: QuestionCategory, limit = 10): Observable<Question[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (category) params = params.set('category', category);
    return this.http.get<Question[]>(`${this.base}/questions/random`, { params });
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  CompleteTrainingGameRequest,
  CompleteTrainingGameResponse,
  DefenseZoneCheckRequest,
  DefenseZoneCheckResponse,
  RoleCheckResponse,
  RoleDefenseCheckRequest,
  RoleReceptionCheckRequest,
  RotationRoundCheckRequest,
  RotationRoundCheckResponse,
} from '@shared/models/training.model';

@Injectable({ providedIn: 'root' })
export class TrainingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  checkRotationRound(payload: RotationRoundCheckRequest): Observable<RotationRoundCheckResponse> {
    return this.http.post<RotationRoundCheckResponse>(`${this.base}/training/rotation/check`, payload);
  }

  checkDefenseZone(payload: DefenseZoneCheckRequest): Observable<DefenseZoneCheckResponse> {
    return this.http.post<DefenseZoneCheckResponse>(`${this.base}/training/defense-zone/check`, payload);
  }

  checkRoleReception(payload: RoleReceptionCheckRequest): Observable<RoleCheckResponse> {
    return this.http.post<RoleCheckResponse>(`${this.base}/training/role-reception/check`, payload);
  }

  checkRoleDefense(payload: RoleDefenseCheckRequest): Observable<RoleCheckResponse> {
    return this.http.post<RoleCheckResponse>(`${this.base}/training/role-defense/check`, payload);
  }

  completeTrainingGame(payload: CompleteTrainingGameRequest): Observable<CompleteTrainingGameResponse> {
    return this.http.post<CompleteTrainingGameResponse>(`${this.base}/training/complete`, payload);
  }
}

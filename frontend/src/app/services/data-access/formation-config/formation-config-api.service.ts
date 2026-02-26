import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AllConfigStatus, ConfigStatus, ZoneConfig } from '@shared/models/formation-config.model';

@Injectable({ providedIn: 'root' })
export class FormationConfigApiService {
  private readonly http = inject(HttpClient);

  getAllStatus(): Observable<AllConfigStatus> {
    return this.http.get<AllConfigStatus>('/api/coach/formation-config/status');
  }

  getRotationZones(family: string, system: string | null, idx: number): Observable<ZoneConfig[]> {
    const systemParam = system ?? 'null';
    return this.http.get<ZoneConfig[]>(`/api/coach/formation-config/${family}/${systemParam}/${idx}`);
  }

  saveRotationZones(family: string, system: string | null, idx: number, zones: ZoneConfig[]): Observable<void> {
    const systemParam = system ?? 'null';
    return this.http.put<void>(`/api/coach/formation-config/${family}/${systemParam}/${idx}`, { zones });
  }

  getGameStatus(gameKey: string): Observable<ConfigStatus> {
    return this.http.get<ConfigStatus>(`/api/training/formation-status/${gameKey}`);
  }
}

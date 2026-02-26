import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FormationConfigApiService } from '@core/services/data-access/formation-config-api.service';
import { AllConfigStatus, ZoneConfig } from '@shared/models/formation-config.model';

@Injectable()
export class CoachFormationsFacade {
  private readonly formationConfigApi = inject(FormationConfigApiService);

  getAllStatus(): Observable<AllConfigStatus> {
    return this.formationConfigApi.getAllStatus();
  }

  getRotationZones(family: string, system: string | null, idx: number): Observable<ZoneConfig[]> {
    return this.formationConfigApi.getRotationZones(family, system, idx);
  }

  saveRotationZones(family: string, system: string | null, idx: number, zones: ZoneConfig[]): Observable<void> {
    return this.formationConfigApi.saveRotationZones(family, system, idx, zones);
  }
}

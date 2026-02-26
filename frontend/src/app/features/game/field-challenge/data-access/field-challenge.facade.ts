import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TrainingApiService } from '@core/services/data-access/training-api.service';
import { FormationConfigApiService } from '@core/services/data-access/formation-config-api.service';
import { AuthService } from '@core/services/auth.service';
import {
  CompleteTrainingGameRequest,
  CompleteTrainingGameResponse,
  DefenseZoneCheckRequest,
  DefenseZoneCheckResponse,
} from '@shared/models/training.model';
import { ConfigStatus } from '@shared/models/formation-config.model';

@Injectable()
export class FieldChallengeFacade {
  private readonly trainingApi = inject(TrainingApiService);
  private readonly formationConfigApi = inject(FormationConfigApiService);
  private readonly auth = inject(AuthService);

  loadConfig(): Observable<ConfigStatus> {
    return this.formationConfigApi.getGameStatus('defense');
  }

  checkDefenseZone(dto: DefenseZoneCheckRequest): Observable<DefenseZoneCheckResponse> {
    return this.trainingApi.checkDefenseZone(dto);
  }

  completeGame(dto: CompleteTrainingGameRequest): Observable<CompleteTrainingGameResponse> {
    return this.trainingApi.completeTrainingGame(dto);
  }

  refreshUser(): Observable<unknown> {
    return this.auth.refreshUser();
  }
}

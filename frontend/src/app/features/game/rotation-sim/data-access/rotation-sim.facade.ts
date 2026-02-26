import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TrainingApiService } from '@core/services/data-access/training-api.service';
import { FormationConfigApiService } from '@core/services/data-access/formation-config-api.service';
import { AuthService } from '@core/services/auth.service';
import {
  CompleteTrainingGameRequest,
  CompleteTrainingGameResponse,
  RotationRoundCheckRequest,
  RotationRoundCheckResponse,
} from '@shared/models/training.model';
import { ConfigStatus } from '@shared/models/formation-config.model';

@Injectable()
export class RotationSimFacade {
  private readonly trainingApi = inject(TrainingApiService);
  private readonly formationConfigApi = inject(FormationConfigApiService);
  private readonly auth = inject(AuthService);

  loadConfig(gameKey: string): Observable<ConfigStatus> {
    return this.formationConfigApi.getGameStatus(gameKey);
  }

  checkRotationRound(dto: RotationRoundCheckRequest): Observable<RotationRoundCheckResponse> {
    return this.trainingApi.checkRotationRound(dto);
  }

  completeGame(dto: CompleteTrainingGameRequest): Observable<CompleteTrainingGameResponse> {
    return this.trainingApi.completeTrainingGame(dto);
  }

  refreshUser(): Observable<unknown> {
    return this.auth.refreshUser();
  }
}

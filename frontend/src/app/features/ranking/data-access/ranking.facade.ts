import { Injectable, inject, signal } from '@angular/core';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { RankingsApiService } from '@core/services/data-access/rankings-api.service';
import { RankingEntry, RankingMode, RankingPosition } from '@shared/models/ranking.model';

/**
 * Facade de Rankings. Se provee en RankingComponent con `providers: [RankingFacade]`
 * para que el estado se destruya al salir de la vista.
 */
@Injectable()
export class RankingFacade {
  private readonly rankingsApi = inject(RankingsApiService);

  readonly mode = signal<RankingMode>('weekly');
  readonly ranking = signal<RankingEntry[]>([]);
  readonly myPosition = signal<RankingPosition | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  setMode(mode: RankingMode): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    this.loadRanking();
  }

  loadRanking(): void {
    const mode = this.mode();
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      ranking: this.rankingsApi.getRanking(mode).pipe(catchError(() => of([] as RankingEntry[]))),
      myPosition: this.rankingsApi.getMyPosition(mode).pipe(catchError(() => of(null))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ ranking, myPosition }) => {
          this.ranking.set(ranking);
          this.myPosition.set(myPosition);
        },
        error: () => this.error.set('No se pudo cargar el ranking. Inténtalo de nuevo.'),
      });
  }
}

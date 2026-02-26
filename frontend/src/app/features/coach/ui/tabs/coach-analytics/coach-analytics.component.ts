import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { HttpErrorService } from '@core/services/http-error.service';
import { CATEGORY_META } from '@shared/constants/question-meta.constants';
import { QuestionCategory } from '@shared/models/question.model';
import { CoachFacade } from '../../../data-access/coach.facade';

@Component({
  selector: 'app-coach-analytics',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './coach-analytics.component.html',
  styleUrls: ['../../coach.component.scss', './coach-analytics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoachAnalyticsComponent {
  private readonly facade = inject(CoachFacade);
  private readonly fb = inject(FormBuilder);
  private readonly httpError = inject(HttpErrorService);

  readonly players = this.facade.players;
  readonly analytics = this.facade.analytics;
  readonly loadingAnalytics = this.facade.loadingAnalytics;
  readonly analyticsError = this.facade.analyticsError;

  readonly reportError = signal<string | null>(null);
  readonly reportLoading = signal(false);

  readonly analyticsWeekOptions = [4, 8, 12, 16, 20, 24];

  readonly analyticsForm = this.fb.nonNullable.group({
    playerId: [''],
    weeks: [8],
  });

  readonly weeklyMaxPoints = computed(() => {
    const analytics = this.analytics();
    if (!analytics) return 1;
    const max = analytics.weeklyEvolution.reduce(
      (currentMax, week) => Math.max(currentMax, week.points),
      0,
    );
    return Math.max(1, max);
  });

  constructor() {
    effect(() => {
      const currentPlayerId = this.analyticsForm.controls.playerId.value;
      const playerIds = this.players().map((player) => player.id);
      if (playerIds.length > 0 && !playerIds.includes(currentPlayerId)) {
        this.analyticsForm.controls.playerId.setValue(playerIds[0]);
      }
    });
  }

  loadAnalytics(): void {
    const formValue = this.analyticsForm.getRawValue();
    if (!formValue.playerId) {
      this.analyticsError.set('Selecciona un jugador para ver la analítica.');
      return;
    }
    this.facade.loadPlayerAnalytics(formValue.playerId, Number(formValue.weeks));
  }

  exportPdfReport(): void {
    const playerId = this.analyticsForm.controls.playerId.value;
    if (!playerId) {
      this.reportError.set('Selecciona un jugador para exportar el informe.');
      return;
    }

    this.reportError.set(null);
    this.reportLoading.set(true);
    this.facade
      .exportPlayerReport(playerId)
      .pipe(
        catchError((error: unknown) => {
          this.reportError.set(
            this.httpError.getMessage(error, 'No se pudo exportar el informe PDF.'),
          );
          return of(null);
        }),
      )
      .subscribe((blob) => {
        this.reportLoading.set(false);
        if (!blob) return;

        const playerName = this.analytics()?.player.username ?? 'jugador';
        const filename = `informe-${playerName}-${new Date().toISOString().slice(0, 10)}.pdf`;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
      });
  }

  getWeeklyBarPercent(points: number): number {
    return Math.round((points / this.weeklyMaxPoints()) * 100);
  }

  getCategoryLabel(category: QuestionCategory | null | undefined): string {
    if (!category) return 'General';
    return CATEGORY_META[category]?.label ?? category;
  }
}

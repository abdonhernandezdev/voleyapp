import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { resolveAvatarIcon } from '@shared/utils/avatar-icon.util';
import { RankingMode } from '@shared/models/ranking.model';
import { RankingFacade } from '../data-access/ranking.facade';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RankingFacade],
})
export class RankingComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly facade = inject(RankingFacade);

  ranking = this.facade.ranking;
  myPosition = this.facade.myPosition;
  mode = this.facade.mode;
  loading = this.facade.loading;
  error = this.facade.error;
  currentUser = this.auth.user;
  readonly isWeeklyMode = computed(() => this.mode() === 'weekly');
  readonly title = computed(() =>
    this.isWeeklyMode() ? 'Ranking semanal' : 'Ranking global',
  );
  readonly subtitle = computed(() =>
    this.isWeeklyMode()
      ? 'Se reinicia automáticamente cada semana.'
      : 'Acumulado histórico de puntos totales.',
  );
  readonly pointsColumnLabel = computed(() =>
    this.isWeeklyMode() ? 'Puntos semana' : 'Puntos globales',
  );
  readonly pointsSuffix = computed(() =>
    this.isWeeklyMode() ? 'pts esta semana' : 'pts globales',
  );

  ngOnInit() {
    this.facade.loadRanking();
  }

  selectMode(mode: RankingMode): void {
    this.facade.setMode(mode);
  }

  getRankClass(rank: number): string {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-other';
  }

  getAvatarIcon(raw?: string): string {
    return resolveAvatarIcon(raw);
  }
}

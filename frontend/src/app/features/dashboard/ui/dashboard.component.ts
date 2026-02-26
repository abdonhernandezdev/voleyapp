import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { CATEGORY_META } from '@shared/constants/question-meta.constants';
import { AssignmentMode, PlayerAssignment } from '@shared/models/coach.model';
import { ScoringGame } from '@shared/models/scoring.model';
import { Reward } from '@shared/models/reward.model';
import { DashboardFacade } from '../data-access/dashboard.facade';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: [
    './dashboard.component.scss',
    './dashboard-games.scss',
    './dashboard-gamecards.scss',
    './dashboard-sidebar.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Facade provista aquí para que su estado se destruya con el componente
  // y no persista entre navegaciones (evita datos stale al volver a la vista).
  providers: [DashboardFacade],
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly facade = inject(DashboardFacade);

  user = this.auth.user;
  isCoach = this.auth.isCoach;
  position = this.facade.position;
  recentSessions = this.facade.recentSessions;
  playerAssignments = this.facade.playerAssignments;
  achievements = this.facade.achievements;
  generalScoringStatus = this.facade.generalScoringStatus;
  rewards = this.facade.rewards;
  rewardPointsBalance = this.facade.rewardPointsBalance;
  loading = this.facade.loading;
  error = this.facade.error;
  generalGames: ScoringGame[] = ['quiz', 'defense_zone', 'reception_5_1', 'duel'];

  // computed() en lugar de arrow function: no se recrea en cada ciclo de CD
  readonly userInitial = computed(() => {
    const name = this.user()?.displayName || this.user()?.username || 'U';
    return name.charAt(0).toUpperCase();
  });

  readonly unlockedAchievements = computed(
    () => this.achievements().filter((achievement) => achievement.unlocked).length,
  );
  readonly featuredRewards = computed(() => this.rewards().slice(0, 3));
  readonly recentSessionsLimited = computed(() => this.recentSessions().slice(0, 5));
  readonly pendingAssignments = computed(() => this.playerAssignments().filter((item) => !item.completed));
  readonly weeklyPoints = computed(() => this.rewardPointsBalance()?.weeklyAvailablePoints ?? 0);
  readonly totalPoints = computed(
    () => this.rewardPointsBalance()?.totalPoints ?? this.user()?.totalPoints ?? 0,
  );

  ngOnInit() {
    this.facade.loadDashboard();
  }

  getRemainingAwards(game: ScoringGame): string {
    const row = this.generalScoringStatus().find((entry) => entry.game === game);
    if (!row || row.remainingAwardsToday === null || row.dailyAwardLimit === null) return '-';
    return `${row.remainingAwardsToday}/${row.dailyAwardLimit}`;
  }

  getGeneralGameLabel(game: ScoringGame): string {
    switch (game) {
      case 'quiz':
        return 'Quiz tecnico';
      case 'defense_zone':
        return 'Defensa por zona';
      case 'reception_5_1':
        return 'Simulador de recepcion';
      case 'duel':
        return 'Duelo 1v1';
      default:
        return game;
    }
  }

  getCatLabel(cat?: string): string {
    if (!cat) return 'General';
    return CATEGORY_META[cat as keyof typeof CATEGORY_META]?.label || cat;
  }

  stockLabel(reward: Reward): string {
    if (reward.stockAvailable === null) return 'Sin limite';
    return `${reward.stockAvailable} disponibles`;
  }

  getAssignmentModeLabel(mode: AssignmentMode): string {
    if (mode === 'quick') return 'Quiz rapido';
    if (mode === 'category') return 'Por categoria';
    return 'Challenge';
  }

  assignmentDueLabel(item: PlayerAssignment): string {
    if (!item.dueDate) return 'Sin fecha limite';
    return `Limite ${new Date(item.dueDate).toLocaleDateString('es-ES')}`;
  }
}

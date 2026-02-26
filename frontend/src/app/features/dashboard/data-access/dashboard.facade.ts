import { Injectable, inject, signal } from '@angular/core';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { AchievementsApiService } from '@core/services/data-access/achievements-api.service';
import { GameSessionsApiService } from '@core/services/data-access/game-sessions-api.service';
import { RankingsApiService } from '@core/services/data-access/rankings-api.service';
import { ScoringApiService } from '@core/services/data-access/scoring-api.service';
import { RewardsApiService } from '@core/services/data-access/rewards-api.service';
import { CoachApiService } from '@core/services/data-access/coach-api.service';
import { Achievement } from '@shared/models/achievement.model';
import { PlayerAssignment } from '@shared/models/coach.model';
import { GameSession } from '@shared/models/game-session.model';
import { Reward, RewardPointsBalance } from '@shared/models/reward.model';
import { DailyScoringStatusItem } from '@shared/models/scoring.model';

/**
 * Facade del Dashboard. NO se declara providedIn: 'root' para evitar
 * que el estado persista entre navegaciones. Se provee directamente en
 * DashboardComponent con `providers: [DashboardFacade]`.
 */
@Injectable()
export class DashboardFacade {
  private readonly gameSessionsApi = inject(GameSessionsApiService);
  private readonly rankingsApi = inject(RankingsApiService);
  private readonly achievementsApi = inject(AchievementsApiService);
  private readonly scoringApi = inject(ScoringApiService);
  private readonly rewardsApi = inject(RewardsApiService);
  private readonly coachApi = inject(CoachApiService);
  private readonly auth = inject(AuthService);

  readonly position = signal<number | null>(null);
  readonly recentSessions = signal<GameSession[]>([]);
  readonly playerAssignments = signal<PlayerAssignment[]>([]);
  readonly achievements = signal<Achievement[]>([]);
  readonly generalScoringStatus = signal<DailyScoringStatusItem[]>([]);
  readonly rewards = signal<Reward[]>([]);
  readonly rewardPointsBalance = signal<RewardPointsBalance | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      user: this.auth.refreshUser().pipe(catchError(() => of(null))),
      position: this.rankingsApi.getMyPosition().pipe(
        map((result) => result.position),
        catchError(() => of(null)),
      ),
      sessions: this.gameSessionsApi.getMySessions(5).pipe(catchError(() => of([] as GameSession[]))),
      achievements: this.achievementsApi.getMine().pipe(catchError(() => of([] as Achievement[]))),
      scoringStatus: this.scoringApi
        .getMyDailyStatus()
        .pipe(map((result) => result.general), catchError(() => of([] as DailyScoringStatusItem[]))),
      rewards: this.rewardsApi.listActiveRewards().pipe(catchError(() => of([] as Reward[]))),
      rewardPointsBalance: this.rewardsApi
        .getPointsBalance()
        .pipe(catchError(() => of(null as RewardPointsBalance | null))),
      assignments: this.coachApi
        .getMyAssignments()
        .pipe(catchError(() => of([] as PlayerAssignment[]))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({
          position,
          sessions,
          achievements,
          scoringStatus,
          rewards,
          rewardPointsBalance,
          assignments,
        }) => {
          this.position.set(position);
          this.recentSessions.set(sessions);
          this.playerAssignments.set(this.filterAssignmentsForHome(assignments));
          this.achievements.set(achievements);
          this.generalScoringStatus.set(scoringStatus);
          this.rewards.set(rewards);
          this.rewardPointsBalance.set(rewardPointsBalance);
        },
        error: () => this.error.set('No se pudo cargar el dashboard. Inténtalo de nuevo.'),
      });
  }

  private filterAssignmentsForHome(assignments: PlayerAssignment[]): PlayerAssignment[] {
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const threshold = Date.now() - oneWeekMs;
    return assignments.filter((assignment) => {
      const createdAtMs = new Date(assignment.createdAt).getTime();
      if (Number.isNaN(createdAtMs)) {
        return true;
      }
      return createdAtMs >= threshold;
    });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoachFacade } from '../data-access/coach.facade';
import { RewardsFacade } from '../../rewards/data-access/rewards.facade';
import { CoachFormationsFacade } from '../data-access/coach-formations.facade';
import { CoachPlayersComponent } from './tabs/coach-players/coach-players.component';
import { CoachQuestionsComponent } from './tabs/coach-questions/coach-questions.component';
import { CoachAssignmentsComponent } from './tabs/coach-assignments/coach-assignments.component';
import { CoachAnalyticsComponent } from './tabs/coach-analytics/coach-analytics.component';
import { CoachRewardsComponent } from './tabs/coach-rewards/coach-rewards.component';
import { CoachFormationsComponent } from './tabs/coach-formations/coach-formations.component';

type CoachTab = 'players' | 'questions' | 'assignments' | 'analytics' | 'rewards' | 'formations';

@Component({
  selector: 'app-coach',
  standalone: true,
  imports: [
    CommonModule,
    CoachPlayersComponent,
    CoachQuestionsComponent,
    CoachAssignmentsComponent,
    CoachAnalyticsComponent,
    CoachRewardsComponent,
    CoachFormationsComponent,
  ],
  templateUrl: './coach.component.html',
  styleUrls: ['./coach.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CoachFacade, RewardsFacade, CoachFormationsFacade],
})
export class CoachComponent implements OnInit {
  private readonly facade = inject(CoachFacade);

  readonly activeTab = signal<CoachTab>('players');

  private readonly players = this.facade.players;
  private readonly questions = this.facade.questions;
  private readonly assignments = this.facade.assignments;

  readonly playerCount = computed(() => this.players().length);
  readonly totalPoints = computed(() =>
    this.players().reduce((sum, player) => sum + player.totalPoints, 0),
  );
  readonly totalGames = computed(() =>
    this.players().reduce((sum, player) => sum + player.gamesPlayed, 0),
  );
  readonly teamAccuracy = computed(() => {
    const total = this.players().reduce((sum, player) => sum + player.gamesPlayed, 0);
    const won = this.players().reduce((sum, player) => sum + player.sessionsWon, 0);
    return total > 0 ? Math.round((won / total) * 100) : 0;
  });
  readonly customQuestionCount = computed(() =>
    this.questions().filter((question) => question.isCustom).length,
  );
  readonly assignmentCompletion = computed(() => {
    const allAssignments = this.assignments();
    if (allAssignments.length === 0) return 0;
    const total = allAssignments.reduce(
      (sum, assignment) => sum + assignment.completion.percent,
      0,
    );
    return Math.round(total / allAssignments.length);
  });

  ngOnInit(): void {
    this.facade.loadAll();
  }

  setTab(tab: CoachTab): void {
    this.activeTab.set(tab);
  }
}

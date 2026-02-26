import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CompleteTrainingGameResponse } from '@shared/models/training.model';
import { SessionScoringSummary } from '@shared/models/game-session.model';

interface UnlockedAchievementView {
  title: string;
  rewardPoints: number;
}

@Component({
  selector: 'app-game-result',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './game-result.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameResultComponent {
  @Input() title = '';
  @Input() score = 0;
  @Input() accuracy: number | null = null;
  @Input() rankingSummary: CompleteTrainingGameResponse | null = null;
  @Input() trainingScoringLabel: string | null = null;
  @Input() quizScoring: SessionScoringSummary | null = null;
  @Input() unlockedAchievements: UnlockedAchievementView[] = [];
  @Input() persistingScore = false;

  @Output() restart = new EventEmitter<void>();
  @Output() goHome = new EventEmitter<void>();
}

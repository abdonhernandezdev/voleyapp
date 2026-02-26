import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Achievement } from '@shared/models/achievement.model';
import { SessionScoringSummary } from '@shared/models/game-session.model';

@Component({
  selector: 'app-quiz-result',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './quiz-result.component.html',
  styleUrls: ['./quiz-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizResultComponent {
  @Input() title = '';
  @Input() correctCount = 0;
  @Input() totalQuestions = 0;
  @Input() sessionPoints = 0;
  @Input() accuracy = 0;
  @Input() finalScoring: SessionScoringSummary | null = null;
  @Input() unlockedAchievements: Achievement[] = [];
  @Output() restart = new EventEmitter<void>();
}

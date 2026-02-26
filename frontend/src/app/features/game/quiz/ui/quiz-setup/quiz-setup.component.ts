import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CATEGORY_META } from '@shared/constants/question-meta.constants';
import { QuestionCategory } from '@shared/models/question.model';

@Component({
  selector: 'app-quiz-setup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-setup.component.html',
  styleUrls: ['./quiz-setup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizSetupComponent {
  @Input() selectedCategory: QuestionCategory | null = null;
  @Output() categoryChange = new EventEmitter<QuestionCategory | null>();
  @Output() start = new EventEmitter<void>();

  readonly categories = Object.entries(CATEGORY_META).map(([key, val]) => ({
    key: key as QuestionCategory,
    ...val,
  }));
}

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmDialogService } from '@core/services/confirm-dialog.service';
import { CATEGORY_META, DIFFICULTY_META } from '@shared/constants/question-meta.constants';
import {
  CoachManagedQuestion,
  CreateCoachQuestionPayload,
  UpdateCoachQuestionPayload,
} from '@shared/models/coach.model';
import { Difficulty, QuestionCategory } from '@shared/models/question.model';
import { CoachFacade } from '../../../data-access/coach.facade';

type QuestionView = 'editor' | 'list';

@Component({
  selector: 'app-coach-questions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './coach-questions.component.html',
  styleUrls: ['../../coach.component.scss', './coach-questions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoachQuestionsComponent {
  private readonly facade = inject(CoachFacade);
  private readonly fb = inject(FormBuilder);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly questions = this.facade.questions;
  readonly loadingQuestions = this.facade.loadingQuestions;
  readonly questionsError = this.facade.questionsError;
  readonly savingQuestion = this.facade.savingQuestion;
  readonly includeInactiveQuestions = this.facade.includeInactiveQuestions;

  readonly questionView = signal<QuestionView>('editor');
  readonly editingQuestionId = signal<string | null>(null);

  readonly categoryOptions = (Object.keys(CATEGORY_META) as QuestionCategory[]).map((value) => ({
    value,
    label: CATEGORY_META[value].label,
  }));

  readonly difficultyOptions = (Object.keys(DIFFICULTY_META) as Difficulty[]).map((value) => ({
    value,
    label: DIFFICULTY_META[value].label,
  }));

  readonly questionForm = this.fb.nonNullable.group({
    question: ['', [Validators.required, Validators.maxLength(400)]],
    explanation: ['', [Validators.maxLength(600)]],
    category: ['game_systems' as QuestionCategory, [Validators.required]],
    difficulty: ['medium' as Difficulty, [Validators.required]],
    optionA: ['', [Validators.required]],
    optionB: ['', [Validators.required]],
    optionC: ['', [Validators.required]],
    optionD: ['', [Validators.required]],
    correctOptionIndex: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
  });

  refreshQuestions(): void {
    this.facade.loadQuestions();
  }

  setQuestionView(view: QuestionView): void {
    this.questionView.set(view);
  }

  openQuestionEditorForCreate(): void {
    this.resetQuestionForm();
    this.questionView.set('editor');
  }

  toggleInactiveQuestions(includeInactive: boolean): void {
    this.facade.setIncludeInactiveQuestions(includeInactive);
  }

  submitQuestion(): void {
    if (this.questionForm.invalid) {
      this.questionForm.markAllAsTouched();
      return;
    }

    const formValue = this.questionForm.getRawValue();
    const options = [
      formValue.optionA.trim(),
      formValue.optionB.trim(),
      formValue.optionC.trim(),
      formValue.optionD.trim(),
    ];
    if (options.some((option) => option.length === 0)) {
      this.questionsError.set('Las 4 opciones del quiz son obligatorias.');
      return;
    }

    const basePayload = {
      category: formValue.category,
      difficulty: formValue.difficulty,
      question: formValue.question.trim(),
      explanation: formValue.explanation.trim() || undefined,
      options,
      correctOptionIndex: Number(formValue.correctOptionIndex),
    };

    const editingId = this.editingQuestionId();
    if (editingId) {
      const updatePayload: UpdateCoachQuestionPayload = {
        category: basePayload.category,
        difficulty: basePayload.difficulty,
        question: basePayload.question,
        explanation: basePayload.explanation,
        options: basePayload.options,
        correctOptionIndex: basePayload.correctOptionIndex,
      };
      this.facade.updateQuestion(editingId, updatePayload, () => this.resetQuestionForm());
      return;
    }

    const createPayload: CreateCoachQuestionPayload = {
      type: 'quiz',
      category: basePayload.category,
      difficulty: basePayload.difficulty,
      question: basePayload.question,
      explanation: basePayload.explanation,
      options: basePayload.options,
      correctOptionIndex: basePayload.correctOptionIndex,
    };
    this.facade.createQuestion(createPayload, () => this.resetQuestionForm());
  }

  startEditQuestion(question: CoachManagedQuestion): void {
    if (!question.isCustom || !question.options || question.options.length < 4) return;
    this.editingQuestionId.set(question.id);
    this.questionForm.patchValue({
      question: question.question,
      explanation: question.explanation ?? '',
      category: question.category,
      difficulty: question.difficulty,
      optionA: question.options[0] ?? '',
      optionB: question.options[1] ?? '',
      optionC: question.options[2] ?? '',
      optionD: question.options[3] ?? '',
      correctOptionIndex: question.correctOptionIndex ?? 0,
    });
    this.questionView.set('editor');
  }

  cancelQuestionEdit(): void {
    this.resetQuestionForm();
  }

  async deactivateQuestion(questionId: string): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      title: 'Desactivar pregunta',
      message: 'La pregunta dejara de aparecer en el juego, pero no se borrara.',
      confirmText: 'Desactivar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    this.facade.deactivateQuestion(questionId);
  }

  activateQuestion(questionId: string): void {
    this.facade.activateQuestion(questionId);
  }

  async deleteQuestionPermanently(question: CoachManagedQuestion): Promise<void> {
    if (!question.isCustom) return;
    const confirmed = await this.confirmDialog.open({
      title: 'Eliminar pregunta',
      message: 'Esta accion eliminara la pregunta permanentemente y no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'danger',
    });
    if (!confirmed) return;
    this.facade.deleteQuestionPermanently(question.id);
  }

  getCategoryLabel(category: QuestionCategory | null | undefined): string {
    if (!category) return 'General';
    return CATEGORY_META[category]?.label ?? category;
  }

  getDifficultyLabel(difficulty: Difficulty): string {
    return DIFFICULTY_META[difficulty]?.label ?? difficulty;
  }

  private resetQuestionForm(): void {
    this.editingQuestionId.set(null);
    this.questionForm.reset({
      question: '',
      explanation: '',
      category: 'game_systems',
      difficulty: 'medium',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOptionIndex: 0,
    });
  }
}

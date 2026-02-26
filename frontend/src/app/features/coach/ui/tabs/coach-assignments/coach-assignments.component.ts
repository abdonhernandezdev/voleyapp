import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { ConfirmDialogService } from '@core/services/confirm-dialog.service';
import { CATEGORY_META } from '@shared/constants/question-meta.constants';
import {
  AssignmentMode,
  AssignmentTargetType,
  CoachAssignment,
  CreateCoachAssignmentPayload,
  UpdateCoachAssignmentPayload,
} from '@shared/models/coach.model';
import { QuestionCategory } from '@shared/models/question.model';
import { CoachFacade } from '../../../data-access/coach.facade';

@Component({
  selector: 'app-coach-assignments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './coach-assignments.component.html',
  styleUrls: ['../../coach.component.scss', '../coach-questions/coach-questions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoachAssignmentsComponent {
  private readonly facade = inject(CoachFacade);
  private readonly fb = inject(FormBuilder);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly players = this.facade.players;
  readonly assignments = this.facade.assignments;
  readonly loadingAssignments = this.facade.loadingAssignments;
  readonly assignmentsError = this.facade.assignmentsError;
  readonly savingAssignment = this.facade.savingAssignment;

  readonly editingAssignmentId = signal<string | null>(null);

  readonly categoryOptions = (Object.keys(CATEGORY_META) as QuestionCategory[]).map((value) => ({
    value,
    label: CATEGORY_META[value].label,
  }));

  readonly modeOptions: Array<{ value: AssignmentMode; label: string }> = [
    { value: 'quick', label: 'Quiz rapido' },
    { value: 'category', label: 'Quiz por categoria' },
    { value: 'challenge', label: 'Modo challenge' },
  ];

  readonly targetOptions: Array<{ value: AssignmentTargetType; label: string }> = [
    { value: 'all_players', label: 'Todo el equipo' },
    { value: 'player', label: 'Jugador individual' },
  ];

  readonly assignmentForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(700)]],
    mode: ['quick' as AssignmentMode, [Validators.required]],
    category: ['' as '' | QuestionCategory],
    targetType: ['all_players' as AssignmentTargetType, [Validators.required]],
    targetUserId: [''],
    dueDate: [''],
    isActive: [true],
  });

  constructor() {
    this.assignmentForm.controls.targetType.valueChanges
      .pipe(
        startWith(this.assignmentForm.controls.targetType.value),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((targetType) => this.updateTargetUserValidation(targetType));
  }

  refreshAssignments(): void {
    this.facade.loadAssignments();
  }

  submitAssignment(): void {
    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    const formValue = this.assignmentForm.getRawValue();
    const assignmentPayload = {
      title: formValue.title.trim(),
      description: formValue.description.trim() || undefined,
      mode: formValue.mode,
      category: formValue.category || undefined,
      targetType: formValue.targetType,
      targetUserId: formValue.targetUserId || undefined,
      dueDate: formValue.dueDate || undefined,
    };

    const editingId = this.editingAssignmentId();
    if (editingId) {
      const updatePayload: UpdateCoachAssignmentPayload = {
        title: assignmentPayload.title,
        description: assignmentPayload.description,
        mode: assignmentPayload.mode,
        category: assignmentPayload.category ?? null,
        targetType: assignmentPayload.targetType,
        targetUserId:
          assignmentPayload.targetType === 'player'
            ? assignmentPayload.targetUserId ?? null
            : null,
        dueDate: assignmentPayload.dueDate ?? null,
        isActive: formValue.isActive,
      };
      this.facade.updateAssignment(editingId, updatePayload, () => this.resetAssignmentForm());
      return;
    }

    const createPayload: CreateCoachAssignmentPayload = {
      ...assignmentPayload,
      targetUserId:
        assignmentPayload.targetType === 'player'
          ? assignmentPayload.targetUserId
          : undefined,
    };
    this.facade.createAssignment(createPayload, () => this.resetAssignmentForm());
  }

  startEditAssignment(assignment: CoachAssignment): void {
    this.editingAssignmentId.set(assignment.id);
    this.assignmentForm.patchValue({
      title: assignment.title,
      description: assignment.description ?? '',
      mode: assignment.mode,
      category: assignment.category ?? '',
      targetType: assignment.targetType,
      targetUserId: assignment.targetUserId ?? '',
      dueDate: assignment.dueDate ?? '',
      isActive: assignment.isActive,
    });
  }

  cancelAssignmentEdit(): void {
    this.resetAssignmentForm();
  }

  async deactivateAssignment(assignmentId: string): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      title: 'Desactivar asignacion',
      message: 'La asignacion quedara inactiva para el seguimiento del equipo.',
      confirmText: 'Desactivar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    this.facade.deactivateAssignment(assignmentId);
  }

  refreshAssignmentProgress(assignmentId: string): void {
    this.facade.loadAssignmentProgress(assignmentId);
  }

  getCategoryLabel(category: QuestionCategory | null | undefined): string {
    if (!category) return 'General';
    return CATEGORY_META[category]?.label ?? category;
  }

  getModeLabel(mode: AssignmentMode): string {
    if (mode === 'category') return 'Categoria';
    if (mode === 'challenge') return 'Challenge';
    return 'Rapido';
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'Sin fecha';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private updateTargetUserValidation(targetType: AssignmentTargetType): void {
    const targetControl = this.assignmentForm.controls.targetUserId;
    if (targetType === 'player') {
      targetControl.setValidators([Validators.required]);
    } else {
      targetControl.clearValidators();
      targetControl.setValue('');
    }
    targetControl.updateValueAndValidity({ emitEvent: false });
  }

  private resetAssignmentForm(): void {
    this.editingAssignmentId.set(null);
    this.assignmentForm.reset({
      title: '',
      description: '',
      mode: 'quick',
      category: '',
      targetType: 'all_players',
      targetUserId: '',
      dueDate: '',
      isActive: true,
    });
  }
}

import { Injectable, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { CoachApiService } from '@core/services/data-access/coach-api.service';
import { HttpErrorService } from '@core/services/http-error.service';
import { NotificationService } from '@core/services/notification.service';
import {
  CoachAssignment,
  CoachManagedQuestion,
  CoachPlayerAnalytics,
  CreateCoachAssignmentPayload,
  CreateCoachQuestionPayload,
  UpdateCoachAssignmentPayload,
  UpdateCoachQuestionPayload,
} from '@shared/models/coach.model';
import { User } from '@shared/models/user.model';

@Injectable()
export class CoachFacade {
  private readonly coachApi = inject(CoachApiService);
  private readonly httpError = inject(HttpErrorService);
  private readonly notifications = inject(NotificationService);

  readonly players = signal<User[]>([]);
  readonly questions = signal<CoachManagedQuestion[]>([]);
  readonly assignments = signal<CoachAssignment[]>([]);
  readonly analytics = signal<CoachPlayerAnalytics | null>(null);

  readonly loadingPlayers = signal(false);
  readonly loadingQuestions = signal(false);
  readonly loadingAssignments = signal(false);
  readonly loadingAnalytics = signal(false);
  readonly savingQuestion = signal(false);
  readonly savingAssignment = signal(false);

  readonly playersError = signal<string | null>(null);
  readonly questionsError = signal<string | null>(null);
  readonly assignmentsError = signal<string | null>(null);
  readonly analyticsError = signal<string | null>(null);

  readonly includeInactiveQuestions = signal(false);

  loadAll(): void {
    this.loadPlayers();
    this.loadQuestions();
    this.loadAssignments();
  }

  loadPlayers(): void {
    this.loadingPlayers.set(true);
    this.playersError.set(null);

    this.coachApi
      .getPlayers()
      .pipe(
        catchError((error: unknown) => {
          this.playersError.set(
            this.httpError.getMessage(
              error,
              'No se pudieron cargar los jugadores del equipo.',
            ),
          );
          return of([] as User[]);
        }),
        finalize(() => this.loadingPlayers.set(false)),
      )
      .subscribe((players) => this.players.set(players));
  }

  setIncludeInactiveQuestions(includeInactive: boolean): void {
    this.includeInactiveQuestions.set(includeInactive);
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.loadingQuestions.set(true);
    this.questionsError.set(null);

    this.coachApi
      .getQuestions(this.includeInactiveQuestions())
      .pipe(
        catchError((error: unknown) => {
          this.questionsError.set(
            this.httpError.getMessage(
              error,
              'No se pudieron cargar las preguntas del entrenador.',
            ),
          );
          return of([] as CoachManagedQuestion[]);
        }),
        finalize(() => this.loadingQuestions.set(false)),
      )
      .subscribe((questions) => this.questions.set(questions));
  }

  createQuestion(
    payload: CreateCoachQuestionPayload,
    onSuccess?: (created: CoachManagedQuestion) => void,
  ): void {
    this.savingQuestion.set(true);
    this.questionsError.set(null);

    this.coachApi
      .createQuestion(payload)
      .pipe(
        tap((created) => {
          this.questions.update((current) => [created, ...current]);
          this.notifications.success('Pregunta creada correctamente.');
          onSuccess?.(created);
        }),
        catchError((error: unknown) => {
          this.notifications.error(
            this.httpError.getMessage(error, 'No se pudo crear la pregunta.'),
          );
          this.questionsError.set(
            this.httpError.getMessage(
              error,
              'No se pudo crear la pregunta.',
            ),
          );
          return of(null);
        }),
        finalize(() => this.savingQuestion.set(false)),
      )
      .subscribe();
  }

  updateQuestion(
    questionId: string,
    payload: UpdateCoachQuestionPayload,
    onSuccess?: (updated: CoachManagedQuestion) => void,
  ): void {
    this.savingQuestion.set(true);
    this.questionsError.set(null);

    this.coachApi
      .updateQuestion(questionId, payload)
      .pipe(
        tap((updated) => {
          this.questions.update((current) =>
            current.map((question) => (question.id === updated.id ? updated : question)),
          );
          this.notifications.success('Pregunta actualizada correctamente.');
          onSuccess?.(updated);
        }),
        catchError((error: unknown) => {
          this.notifications.error(
            this.httpError.getMessage(error, 'No se pudo actualizar la pregunta.'),
          );
          this.questionsError.set(
            this.httpError.getMessage(
              error,
              'No se pudo actualizar la pregunta.',
            ),
          );
          return of(null);
        }),
        finalize(() => this.savingQuestion.set(false)),
      )
      .subscribe();
  }

  deactivateQuestion(questionId: string): void {
    this.savingQuestion.set(true);
    this.questionsError.set(null);

    this.coachApi
      .deleteQuestion(questionId)
      .pipe(
        tap(() => {
          this.notifications.info('Pregunta desactivada.');
          this.loadQuestions();
        }),
        catchError((error: unknown) => {
          this.notifications.error(
            this.httpError.getMessage(error, 'No se pudo desactivar la pregunta.'),
          );
          this.questionsError.set(
            this.httpError.getMessage(
              error,
              'No se pudo desactivar la pregunta.',
            ),
          );
          return of(null);
        }),
        finalize(() => this.savingQuestion.set(false)),
      )
      .subscribe();
  }

  deleteQuestionPermanently(questionId: string): void {
    this.savingQuestion.set(true);
    this.questionsError.set(null);

    this.coachApi
      .deleteQuestionPermanently(questionId)
      .pipe(
        tap(() => {
          this.questions.update((current) =>
            current.filter((question) => question.id !== questionId),
          );
          this.notifications.success('Pregunta eliminada definitivamente.');
        }),
        catchError((error: unknown) => {
          this.notifications.error(
            this.httpError.getMessage(error, 'No se pudo eliminar la pregunta definitivamente.'),
          );
          this.questionsError.set(
            this.httpError.getMessage(
              error,
              'No se pudo eliminar la pregunta definitivamente.',
            ),
          );
          return of(null);
        }),
        finalize(() => this.savingQuestion.set(false)),
      )
      .subscribe();
  }

  activateQuestion(questionId: string): void {
    this.updateQuestion(questionId, { isActive: true });
  }

  loadAssignments(): void {
    this.loadingAssignments.set(true);
    this.assignmentsError.set(null);

    this.coachApi
      .getAssignments()
      .pipe(
        catchError((error: unknown) => {
          this.assignmentsError.set(
            this.httpError.getMessage(
              error,
              'No se pudieron cargar las asignaciones.',
            ),
          );
          return of([] as CoachAssignment[]);
        }),
        finalize(() => this.loadingAssignments.set(false)),
      )
      .subscribe((assignments) => this.assignments.set(assignments));
  }

  createAssignment(
    payload: CreateCoachAssignmentPayload,
    onSuccess?: (created: CoachAssignment) => void,
  ): void {
    this.savingAssignment.set(true);
    this.assignmentsError.set(null);

    this.coachApi
      .createAssignment(payload)
      .pipe(
        tap((created) => {
          this.assignments.update((current) => [created, ...current]);
          this.notifications.success('Asignacion creada correctamente.');
          onSuccess?.(created);
        }),
        catchError((error: unknown) => {
          this.notifications.error(
            this.httpError.getMessage(error, 'No se pudo crear la asignación.'),
          );
          this.assignmentsError.set(
            this.httpError.getMessage(
              error,
              'No se pudo crear la asignación.',
            ),
          );
          return of(null);
        }),
        finalize(() => this.savingAssignment.set(false)),
      )
      .subscribe();
  }

  updateAssignment(
    assignmentId: string,
    payload: UpdateCoachAssignmentPayload,
    onSuccess?: (updated: CoachAssignment) => void,
  ): void {
    this.savingAssignment.set(true);
    this.assignmentsError.set(null);

    this.coachApi
      .updateAssignment(assignmentId, payload)
      .pipe(
        tap((updated) => {
          this.assignments.update((current) =>
            current.map((assignment) =>
              assignment.id === updated.id ? updated : assignment,
            ),
          );
          this.notifications.success('Asignacion actualizada correctamente.');
          onSuccess?.(updated);
        }),
        catchError((error: unknown) => {
          this.notifications.error(
            this.httpError.getMessage(error, 'No se pudo actualizar la asignación.'),
          );
          this.assignmentsError.set(
            this.httpError.getMessage(
              error,
              'No se pudo actualizar la asignación.',
            ),
          );
          return of(null);
        }),
        finalize(() => this.savingAssignment.set(false)),
      )
      .subscribe();
  }

  deactivateAssignment(assignmentId: string): void {
    this.savingAssignment.set(true);
    this.assignmentsError.set(null);

    this.coachApi
      .deleteAssignment(assignmentId)
      .pipe(
        tap(() => {
          this.notifications.info('Asignacion desactivada.');
          this.loadAssignments();
        }),
        catchError((error: unknown) => {
          this.notifications.error(
            this.httpError.getMessage(error, 'No se pudo desactivar la asignación.'),
          );
          this.assignmentsError.set(
            this.httpError.getMessage(
              error,
              'No se pudo desactivar la asignación.',
            ),
          );
          return of(null);
        }),
        finalize(() => this.savingAssignment.set(false)),
      )
      .subscribe();
  }

  loadAssignmentProgress(assignmentId: string): void {
    this.loadingAssignments.set(true);
    this.assignmentsError.set(null);

    this.coachApi
      .getAssignmentProgress(assignmentId)
      .pipe(
        tap((fullAssignment) => {
          this.assignments.update((current) =>
            current.map((assignment) =>
              assignment.id === fullAssignment.id ? fullAssignment : assignment,
            ),
          );
        }),
        catchError((error: unknown) => {
          this.assignmentsError.set(
            this.httpError.getMessage(
              error,
              'No se pudo cargar el progreso de la asignación.',
            ),
          );
          return of(null);
        }),
        finalize(() => this.loadingAssignments.set(false)),
      )
      .subscribe();
  }

  loadPlayerAnalytics(playerId: string, weeks = 8): void {
    this.loadingAnalytics.set(true);
    this.analyticsError.set(null);

    this.coachApi
      .getPlayerAnalytics(playerId, weeks)
      .pipe(
        catchError((error: unknown) => {
          this.analyticsError.set(
            this.httpError.getMessage(
              error,
              'No se pudo cargar la analítica del jugador.',
            ),
          );
          return of(null);
        }),
        finalize(() => this.loadingAnalytics.set(false)),
      )
      .subscribe((analytics) => this.analytics.set(analytics));
  }

  clearAnalytics(): void {
    this.analytics.set(null);
    this.analyticsError.set(null);
  }

  exportPlayerReport(playerId: string) {
    return this.coachApi.exportPlayerReport(playerId);
  }
}

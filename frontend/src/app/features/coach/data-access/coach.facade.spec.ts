import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CoachApiService } from '@core/services/data-access/coach-api.service';
import { HttpErrorService } from '@core/services/http-error.service';
import { NotificationService } from '@core/services/notification.service';
import { CoachFacade } from './coach.facade';

describe('CoachFacade', () => {
  let facade: CoachFacade;
  let api: {
    getPlayers: jest.Mock;
    getQuestions: jest.Mock;
    createQuestion: jest.Mock;
    updateQuestion: jest.Mock;
    deleteQuestion: jest.Mock;
    deleteQuestionPermanently: jest.Mock;
    getAssignments: jest.Mock;
    createAssignment: jest.Mock;
    updateAssignment: jest.Mock;
    deleteAssignment: jest.Mock;
    getAssignmentProgress: jest.Mock;
    getPlayerAnalytics: jest.Mock;
    exportPlayerReport: jest.Mock;
  };
  let httpError: { getMessage: jest.Mock };
  let notifications: { success: jest.Mock; error: jest.Mock; info: jest.Mock };

  beforeEach(() => {
    api = {
      getPlayers: jest.fn(() => of([{ id: 'u1' }])),
      getQuestions: jest.fn(() => of([{ id: 'q1', isCustom: true }])),
      createQuestion: jest.fn(() => of({ id: 'q2', isCustom: true })),
      updateQuestion: jest.fn(() => of({ id: 'q1', isCustom: true, question: 'updated' })),
      deleteQuestion: jest.fn(() => of({ ok: true })),
      deleteQuestionPermanently: jest.fn(() => of({ ok: true })),
      getAssignments: jest.fn(() => of([{ id: 'a1', completion: { percent: 10 } }])),
      createAssignment: jest.fn(() => of({ id: 'a2', completion: { percent: 0 } })),
      updateAssignment: jest.fn(() => of({ id: 'a1', completion: { percent: 100 } })),
      deleteAssignment: jest.fn(() => of({ ok: true })),
      getAssignmentProgress: jest.fn(() => of({ id: 'a1', completion: { percent: 80 } })),
      getPlayerAnalytics: jest.fn(() => of({ player: { id: 'u1' } })),
      exportPlayerReport: jest.fn(() => of(new Blob())),
    };
    httpError = {
      getMessage: jest.fn((_e, fallback) => fallback ?? 'error'),
    };
    notifications = {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CoachFacade,
        { provide: CoachApiService, useValue: api },
        { provide: HttpErrorService, useValue: httpError },
        { provide: NotificationService, useValue: notifications },
      ],
    });

    facade = TestBed.inject(CoachFacade);
  });

  it('loadAll triggers players, questions and assignments', () => {
    const p = jest.spyOn(facade, 'loadPlayers');
    const q = jest.spyOn(facade, 'loadQuestions');
    const a = jest.spyOn(facade, 'loadAssignments');
    facade.loadAll();
    expect(p).toHaveBeenCalled();
    expect(q).toHaveBeenCalled();
    expect(a).toHaveBeenCalled();
  });

  it('loads players and handles errors', () => {
    facade.loadPlayers();
    expect(facade.players()).toEqual([{ id: 'u1' } as never]);
    expect(facade.loadingPlayers()).toBe(false);

    api.getPlayers.mockReturnValueOnce(throwError(() => new Error('boom')));
    facade.loadPlayers();
    expect(facade.playersError()).toContain('No se pudieron cargar los jugadores');
    expect(facade.loadingPlayers()).toBe(false);
  });

  it('toggles include inactive questions and loads questions', () => {
    const spy = jest.spyOn(facade, 'loadQuestions');
    facade.setIncludeInactiveQuestions(true);
    expect(facade.includeInactiveQuestions()).toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  it('loads questions and handles error', () => {
    facade.loadQuestions();
    expect(api.getQuestions).toHaveBeenCalledWith(false);
    expect(facade.questions()).toEqual([{ id: 'q1', isCustom: true } as never]);

    api.getQuestions.mockReturnValueOnce(throwError(() => new Error('boom')));
    facade.loadQuestions();
    expect(facade.questionsError()).toContain('No se pudieron cargar las preguntas');
  });

  it('creates, updates, deactivates and deletes question', () => {
    const onSuccess = jest.fn();
    facade.questions.set([{ id: 'q1', isCustom: true } as never]);

    facade.createQuestion({ question: 'q' } as never, onSuccess);
    expect(facade.questions().map((q) => q.id)).toContain('q2');
    expect(notifications.success).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();

    facade.updateQuestion('q1', { question: 'qq' } as never, onSuccess);
    expect(notifications.success).toHaveBeenCalled();

    facade.deactivateQuestion('q1');
    expect(api.deleteQuestion).toHaveBeenCalledWith('q1');
    expect(notifications.info).toHaveBeenCalled();

    facade.deleteQuestionPermanently('q1');
    expect(api.deleteQuestionPermanently).toHaveBeenCalledWith('q1');
    expect(notifications.success).toHaveBeenCalled();
  });

  it('activateQuestion delegates to update with isActive true', () => {
    const spy = jest.spyOn(facade, 'updateQuestion');
    facade.activateQuestion('q99');
    expect(spy).toHaveBeenCalledWith('q99', { isActive: true });
  });

  it('handles question mutation errors', () => {
    api.createQuestion.mockReturnValueOnce(throwError(() => new Error('boom')));
    api.updateQuestion.mockReturnValueOnce(throwError(() => new Error('boom')));
    api.deleteQuestion.mockReturnValueOnce(throwError(() => new Error('boom')));
    api.deleteQuestionPermanently.mockReturnValueOnce(throwError(() => new Error('boom')));

    facade.createQuestion({ question: 'q' } as never);
    facade.updateQuestion('q1', { question: 'qq' } as never);
    facade.deactivateQuestion('q1');
    facade.deleteQuestionPermanently('q1');

    expect(notifications.error).toHaveBeenCalled();
    expect(facade.savingQuestion()).toBe(false);
  });

  it('loads assignments and handles errors', () => {
    facade.loadAssignments();
    expect(facade.assignments()).toEqual([{ id: 'a1', completion: { percent: 10 } } as never]);
    expect(facade.loadingAssignments()).toBe(false);

    api.getAssignments.mockReturnValueOnce(throwError(() => new Error('boom')));
    facade.loadAssignments();
    expect(facade.assignmentsError()).toContain('No se pudieron cargar las asignaciones');
  });

  it('creates, updates and deactivates assignments', () => {
    const onSuccess = jest.fn();
    facade.assignments.set([{ id: 'a1', completion: { percent: 10 } } as never]);

    facade.createAssignment({ title: 'A' } as never, onSuccess);
    expect(facade.assignments().map((a) => a.id)).toContain('a2');
    expect(onSuccess).toHaveBeenCalled();

    facade.updateAssignment('a1', { title: 'B' } as never, onSuccess);
    expect(notifications.success).toHaveBeenCalled();

    facade.deactivateAssignment('a1');
    expect(api.deleteAssignment).toHaveBeenCalledWith('a1');
    expect(notifications.info).toHaveBeenCalled();
  });

  it('handles assignment mutation errors', () => {
    api.createAssignment.mockReturnValueOnce(throwError(() => new Error('boom')));
    api.updateAssignment.mockReturnValueOnce(throwError(() => new Error('boom')));
    api.deleteAssignment.mockReturnValueOnce(throwError(() => new Error('boom')));

    facade.createAssignment({ title: 'A' } as never);
    facade.updateAssignment('a1', { title: 'B' } as never);
    facade.deactivateAssignment('a1');

    expect(notifications.error).toHaveBeenCalled();
    expect(facade.savingAssignment()).toBe(false);
  });

  it('loads assignment progress and handles errors', () => {
    facade.assignments.set([{ id: 'a1', completion: { percent: 10 } } as never]);
    facade.loadAssignmentProgress('a1');
    expect(api.getAssignmentProgress).toHaveBeenCalledWith('a1');
    expect(facade.assignments()[0].completion.percent).toBe(80);

    api.getAssignmentProgress.mockReturnValueOnce(throwError(() => new Error('boom')));
    facade.loadAssignmentProgress('a1');
    expect(facade.assignmentsError()).toContain('No se pudo cargar el progreso');
  });

  it('loads analytics, clears analytics and exports report', () => {
    facade.loadPlayerAnalytics('u1', 12);
    expect(api.getPlayerAnalytics).toHaveBeenCalledWith('u1', 12);
    expect(facade.analytics()).toEqual({ player: { id: 'u1' } } as never);

    facade.clearAnalytics();
    expect(facade.analytics()).toBeNull();
    expect(facade.analyticsError()).toBeNull();

    facade.exportPlayerReport('u1').subscribe();
    expect(api.exportPlayerReport).toHaveBeenCalledWith('u1');
  });

  it('handles analytics error', () => {
    api.getPlayerAnalytics.mockReturnValueOnce(throwError(() => new Error('boom')));
    facade.loadPlayerAnalytics('u1', 4);
    expect(facade.analyticsError()).toContain('No se pudo cargar la analítica');
    expect(facade.loadingAnalytics()).toBe(false);
  });
});


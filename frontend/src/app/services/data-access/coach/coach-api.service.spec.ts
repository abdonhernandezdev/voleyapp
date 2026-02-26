import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { CoachApiService } from './coach-api.service';

describe('CoachApiService', () => {
  let service: CoachApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CoachApiService],
    });
    service = TestBed.inject(CoachApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('gets players', () => {
    service.getPlayers().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/coach/players`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('gets questions with includeInactive param', () => {
    service.getQuestions(true).subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === `${environment.apiUrl}/coach/questions` &&
      r.params.get('includeInactive') === 'true',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('gets questions with includeInactive=false by default', () => {
    service.getQuestions().subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === `${environment.apiUrl}/coach/questions` &&
      r.params.get('includeInactive') === 'false',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('creates/updates/deletes questions', () => {
    service.createQuestion({ type: 'quiz', question: 'Q', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 0, category: 'game_systems', difficulty: 'easy' } as never).subscribe();
    let req = httpMock.expectOne(`${environment.apiUrl}/coach/questions`);
    expect(req.request.method).toBe('POST');
    req.flush({});

    service.updateQuestion('q1', { question: 'Q2' } as never).subscribe();
    req = httpMock.expectOne(`${environment.apiUrl}/coach/questions/q1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    service.deleteQuestion('q1').subscribe();
    req = httpMock.expectOne(`${environment.apiUrl}/coach/questions/q1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ ok: true });

    service.deleteQuestionPermanently('q1').subscribe();
    req = httpMock.expectOne(`${environment.apiUrl}/coach/questions/q1/permanent`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ ok: true });
  });

  it('gets and manages assignments', () => {
    service.getAssignments().subscribe();
    let req = httpMock.expectOne(`${environment.apiUrl}/coach/assignments`);
    expect(req.request.method).toBe('GET');
    req.flush([]);

    service.createAssignment({ title: 'A', mode: 'quick', targetType: 'all_players' } as never).subscribe();
    req = httpMock.expectOne(`${environment.apiUrl}/coach/assignments`);
    expect(req.request.method).toBe('POST');
    req.flush({});

    service.updateAssignment('a1', { title: 'B' } as never).subscribe();
    req = httpMock.expectOne(`${environment.apiUrl}/coach/assignments/a1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    service.deleteAssignment('a1').subscribe();
    req = httpMock.expectOne(`${environment.apiUrl}/coach/assignments/a1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ ok: true });
  });

  it('gets assignment progress and my assignments', () => {
    service.getAssignmentProgress('a1').subscribe();
    let req = httpMock.expectOne(`${environment.apiUrl}/coach/assignments/a1/progress`);
    expect(req.request.method).toBe('GET');
    req.flush({});

    service.getMyAssignments().subscribe();
    req = httpMock.expectOne(`${environment.apiUrl}/assignments/my`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('gets analytics and exports report', () => {
    service.getPlayerAnalytics('u1', 12).subscribe();
    let req = httpMock.expectOne((r) =>
      r.url === `${environment.apiUrl}/coach/players/u1/analytics` &&
      r.params.get('weeks') === '12',
    );
    expect(req.request.method).toBe('GET');
    req.flush({});

    service.exportPlayerReport('u1').subscribe();
    req = httpMock.expectOne(`${environment.apiUrl}/coach/players/u1/report`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('gets analytics with default weeks=8', () => {
    service.getPlayerAnalytics('u1').subscribe();
    const req = httpMock.expectOne((r) =>
      r.url === `${environment.apiUrl}/coach/players/u1/analytics` &&
      r.params.get('weeks') === '8',
    );
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});

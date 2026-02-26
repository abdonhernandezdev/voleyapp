import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { GameSessionsApiService } from '@core/services/data-access/game-sessions-api.service';
import { QuizFacade } from './quiz.facade';

describe('QuizFacade', () => {
  let facade: QuizFacade;
  let gameSessionsApi: {
    startSession: jest.Mock;
    submitAnswer: jest.Mock;
    completeSession: jest.Mock;
  };
  let auth: { refreshUser: jest.Mock };

  beforeEach(() => {
    gameSessionsApi = {
      startSession: jest.fn(),
      submitAnswer: jest.fn(),
      completeSession: jest.fn(),
    };
    auth = {
      refreshUser: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        QuizFacade,
        { provide: GameSessionsApiService, useValue: gameSessionsApi },
        { provide: AuthService, useValue: auth },
      ],
    });
    facade = TestBed.inject(QuizFacade);
  });

  it('starts quick session when no category', () => {
    gameSessionsApi.startSession.mockReturnValue(of({}));
    facade.startSession().subscribe();
    expect(gameSessionsApi.startSession).toHaveBeenCalledWith('quick', undefined);
  });

  it('starts category session when category exists', () => {
    gameSessionsApi.startSession.mockReturnValue(of({}));
    facade.startSession('game_systems').subscribe();
    expect(gameSessionsApi.startSession).toHaveBeenCalledWith('category', 'game_systems');
  });

  it('submits answer through api', () => {
    gameSessionsApi.submitAnswer.mockReturnValue(of({}));
    facade.submitAnswer('s1', 'q1', 2, 9).subscribe();
    expect(gameSessionsApi.submitAnswer).toHaveBeenCalledWith('s1', 'q1', 2, 9);
  });

  it('completes session and maps achievements/scoring after refreshing user', () => {
    gameSessionsApi.completeSession.mockReturnValue(
      of({
        unlockedAchievements: [{ id: 'a1' }],
        scoring: { awardedPoints: 50 },
      }),
    );
    auth.refreshUser.mockReturnValue(of({}));

    facade.completeSession('s1', 100).subscribe((result) => {
      expect(result).toEqual({
        achievements: [{ id: 'a1' }],
        scoring: { awardedPoints: 50 },
      });
    });

    expect(gameSessionsApi.completeSession).toHaveBeenCalledWith('s1', 100);
    expect(auth.refreshUser).toHaveBeenCalled();
  });
});


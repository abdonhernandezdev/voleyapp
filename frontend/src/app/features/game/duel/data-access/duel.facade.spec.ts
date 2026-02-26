import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { DuelSocketService } from '@core/services/duel-socket.service';
import { DuelFacade } from './duel.facade';

describe('DuelFacade', () => {
  let facade: DuelFacade;
  let connected$: BehaviorSubject<boolean>;
  let state$: BehaviorSubject<unknown>;
  let error$: BehaviorSubject<string | null>;
  let socket: {
    connected$: BehaviorSubject<boolean>;
    state$: BehaviorSubject<unknown>;
    error$: BehaviorSubject<string | null>;
    connect: jest.Mock;
    disconnect: jest.Mock;
    createRoom: jest.Mock;
    joinRoom: jest.Mock;
    startRoom: jest.Mock;
    submitAnswer: jest.Mock;
    requestState: jest.Mock;
    clearError: jest.Mock;
  };

  beforeEach(() => {
    connected$ = new BehaviorSubject<boolean>(false);
    state$ = new BehaviorSubject<unknown>(null);
    error$ = new BehaviorSubject<string | null>(null);
    socket = {
      connected$,
      state$,
      error$,
      connect: jest.fn(),
      disconnect: jest.fn(),
      createRoom: jest.fn(),
      joinRoom: jest.fn(),
      startRoom: jest.fn(),
      submitAnswer: jest.fn(),
      requestState: jest.fn(),
      clearError: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        DuelFacade,
        { provide: DuelSocketService, useValue: socket },
        { provide: AuthService, useValue: { user: signal({ id: 'u1', role: 'player' }) } },
      ],
    });
    facade = TestBed.inject(DuelFacade);
  });

  it('mirrors socket streams', () => {
    connected$.next(true);
    state$.next({ roomCode: 'ABC123', hostUserId: 'u1', players: [] });
    error$.next('boom');

    expect(facade.connected()).toBe(true);
    expect(facade.state()).toEqual({ roomCode: 'ABC123', hostUserId: 'u1', players: [] });
    expect(facade.error()).toBe('boom');
    expect(facade.roomCode()).toBe('ABC123');
    expect(facade.isHost()).toBe(true);
  });

  it('initializes and destroys socket connection', () => {
    facade.init();
    facade.destroy();
    expect(socket.connect).toHaveBeenCalled();
    expect(socket.disconnect).toHaveBeenCalled();
  });

  it('creates and joins room after clearing errors', () => {
    facade.createRoom('game_systems');
    facade.joinRoom('ABC123');
    expect(socket.clearError).toHaveBeenCalledTimes(2);
    expect(socket.createRoom).toHaveBeenCalledWith('game_systems');
    expect(socket.joinRoom).toHaveBeenCalledWith('ABC123');
  });

  it('starts room only when room code exists', () => {
    facade.startRoom();
    expect(socket.startRoom).not.toHaveBeenCalled();

    state$.next({ roomCode: 'XYZ999', hostUserId: 'u1', players: [] });
    facade.startRoom();
    expect(socket.startRoom).toHaveBeenCalledWith('XYZ999');
  });

  it('answers and refreshes state only when room code exists', () => {
    facade.answer('q1', 2, 8);
    facade.refreshState();
    expect(socket.submitAnswer).not.toHaveBeenCalled();
    expect(socket.requestState).not.toHaveBeenCalled();

    state$.next({ roomCode: 'ROOM1', hostUserId: 'u1', players: [] });
    facade.answer('q1', 2, 8);
    facade.refreshState();
    expect(socket.submitAnswer).toHaveBeenCalledWith('ROOM1', 'q1', 2, 8);
    expect(socket.requestState).toHaveBeenCalledWith('ROOM1');
  });

  it('clearError delegates to socket', () => {
    facade.clearError();
    expect(socket.clearError).toHaveBeenCalled();
  });
});


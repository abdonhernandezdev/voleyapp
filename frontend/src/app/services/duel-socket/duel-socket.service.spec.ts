import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { DuelSocketService } from './duel-socket.service';

const handlers = new Map<string, (payload?: unknown) => void>();

const socketMock = {
  connected: false,
  on: jest.fn((event: string, cb: (payload?: unknown) => void) => {
    handlers.set(event, cb);
  }),
  emit: jest.fn(),
  connect: jest.fn(() => {
    socketMock.connected = true;
  }),
  disconnect: jest.fn(() => {
    socketMock.connected = false;
  }),
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => socketMock),
}));

describe('DuelSocketService', () => {
  let service: DuelSocketService;

  beforeEach(() => {
    handlers.clear();
    socketMock.connected = false;
    socketMock.on.mockClear();
    socketMock.emit.mockClear();
    socketMock.connect.mockClear();
    socketMock.disconnect.mockClear();

    TestBed.configureTestingModule({
      providers: [DuelSocketService],
    });
    service = TestBed.inject(DuelSocketService);
  });

  it('connect initializes socket and registers listeners', () => {
    service.connect();

    expect(socketMock.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(socketMock.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(socketMock.on).toHaveBeenCalledWith('duel:state', expect.any(Function));
    expect(socketMock.on).toHaveBeenCalledWith('duel:error', expect.any(Function));
    expect(socketMock.connect).toHaveBeenCalled();
  });

  it('connect does nothing when already connected', () => {
    socketMock.connected = true;
    service.connect();
    expect(socketMock.connect).not.toHaveBeenCalled();
  });

  it('updates streams from socket events', () => {
    let connectedValue = false;
    let stateValue: unknown = null;
    let errorValue: string | null = null;

    service.connected$.subscribe((v) => (connectedValue = v));
    service.state$.subscribe((v) => (stateValue = v));
    service.error$.subscribe((v) => (errorValue = v));

    service.connect();

    handlers.get('connect')?.();
    expect(connectedValue).toBe(true);
    expect(errorValue).toBeNull();

    handlers.get('duel:state')?.({ roomCode: 'ABC123' });
    expect(stateValue).toEqual({ roomCode: 'ABC123' });

    handlers.get('duel:error')?.({ message: 'fail' });
    expect(errorValue).toBe('fail');

    handlers.get('disconnect')?.();
    expect(connectedValue).toBe(false);
  });

  it('emits duel events when socket is connected', () => {
    service.connect();
    socketMock.connected = true;

    service.createRoom('game_systems');
    service.joinRoom('ABC123');
    service.startRoom('ABC123');
    service.submitAnswer('ABC123', 'q1', 2, 7);
    service.requestState('ABC123');

    expect(socketMock.emit).toHaveBeenCalledWith('duel:create', { category: 'game_systems' });
    expect(socketMock.emit).toHaveBeenCalledWith('duel:join', { roomCode: 'ABC123' });
    expect(socketMock.emit).toHaveBeenCalledWith('duel:start', { roomCode: 'ABC123' });
    expect(socketMock.emit).toHaveBeenCalledWith('duel:answer', {
      roomCode: 'ABC123',
      questionId: 'q1',
      selectedOptionIndex: 2,
      timeSeconds: 7,
    });
    expect(socketMock.emit).toHaveBeenCalledWith('duel:get-state', { roomCode: 'ABC123' });
  });

  it('throws when emitting while disconnected', () => {
    expect(() => service.createRoom()).toThrow('Socket no conectado');
    expect(() => service.joinRoom('ABC123')).toThrow('Socket no conectado');
  });

  it('disconnect clears state and connected stream', () => {
    let connectedValue = true;
    let stateValue: unknown = { roomCode: 'ABC123' };
    service.connected$.subscribe((v) => (connectedValue = v));
    service.state$.subscribe((v) => (stateValue = v));

    service.connect();
    service.disconnect();

    expect(socketMock.disconnect).toHaveBeenCalled();
    expect(connectedValue).toBe(false);
    expect(stateValue).toBeNull();
  });

  it('clearError resets error stream', () => {
    let errorValue: string | null = null;
    service.error$.subscribe((v) => (errorValue = v));
    service.connect();
    handlers.get('duel:error')?.({ message: 'fail' });
    expect(errorValue).toBe('fail');
    service.clearError();
    expect(errorValue).toBeNull();
  });

  it('uses environment socket configuration', () => {
    const { io } = jest.requireMock('socket.io-client') as { io: jest.Mock };
    service.connect();
    expect(io).toHaveBeenCalledWith(environment.socketNamespace, {
      path: environment.socketPath,
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
  });
});


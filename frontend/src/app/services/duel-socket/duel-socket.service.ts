import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { DuelState } from '@shared/models/duel.model';
import { QuestionCategory } from '@shared/models/question.model';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class DuelSocketService {
  private socket: Socket | null = null;

  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  private readonly stateSubject = new BehaviorSubject<DuelState | null>(null);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  readonly connected$: Observable<boolean> = this.connectedSubject.asObservable();
  readonly state$: Observable<DuelState | null> = this.stateSubject.asObservable();
  readonly error$: Observable<string | null> = this.errorSubject.asObservable();

  connect(): void {
    if (this.socket?.connected) return;
    if (!this.socket) {
      this.socket = io(environment.socketNamespace, {
        path: environment.socketPath,
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        this.connectedSubject.next(true);
        this.errorSubject.next(null);
      });

      this.socket.on('disconnect', () => {
        this.connectedSubject.next(false);
      });

      this.socket.on('duel:state', (state: DuelState) => {
        this.stateSubject.next(state);
      });

      this.socket.on('duel:error', (payload: { message?: string }) => {
        this.errorSubject.next(payload?.message ?? 'Error en duelo');
      });
    }

    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.connectedSubject.next(false);
    this.stateSubject.next(null);
  }

  createRoom(category?: QuestionCategory): void {
    this.ensureConnected();
    this.socket!.emit('duel:create', category ? { category } : {});
  }

  joinRoom(roomCode: string): void {
    this.ensureConnected();
    this.socket!.emit('duel:join', { roomCode });
  }

  startRoom(roomCode: string): void {
    this.ensureConnected();
    this.socket!.emit('duel:start', { roomCode });
  }

  submitAnswer(roomCode: string, questionId: string, selectedOptionIndex: number, timeSeconds: number): void {
    this.ensureConnected();
    this.socket!.emit('duel:answer', {
      roomCode,
      questionId,
      selectedOptionIndex,
      timeSeconds,
    });
  }

  requestState(roomCode: string): void {
    this.ensureConnected();
    this.socket!.emit('duel:get-state', { roomCode });
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  private ensureConnected(): void {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Socket no conectado');
    }
  }
}

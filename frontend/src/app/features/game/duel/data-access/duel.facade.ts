import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/services/auth.service';
import { DuelSocketService } from '@core/services/duel-socket.service';
import { DuelState } from '@shared/models/duel.model';
import { QuestionCategory } from '@shared/models/question.model';

@Injectable()
export class DuelFacade {
  private readonly socket = inject(DuelSocketService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly connected = signal(false);
  readonly state = signal<DuelState | null>(null);
  readonly error = signal<string | null>(null);
  readonly user = this.auth.user;

  readonly roomCode = computed(() => this.state()?.roomCode ?? null);
  readonly isHost = computed(() => {
    const state = this.state();
    const user = this.user();
    if (!state || !user) return false;
    return state.hostUserId === user.id;
  });

  constructor() {
    this.socket.connected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((connected) => this.connected.set(connected));

    this.socket.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => this.state.set(state));

    this.socket.error$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((error) => this.error.set(error));
  }

  init(): void {
    this.socket.connect();
  }

  destroy(): void {
    this.socket.disconnect();
  }

  createRoom(category?: QuestionCategory): void {
    this.socket.clearError();
    this.socket.createRoom(category);
  }

  joinRoom(roomCode: string): void {
    this.socket.clearError();
    this.socket.joinRoom(roomCode);
  }

  startRoom(): void {
    const roomCode = this.roomCode();
    if (!roomCode) return;
    this.socket.startRoom(roomCode);
  }

  answer(questionId: string, selectedOptionIndex: number, timeSeconds: number): void {
    const roomCode = this.roomCode();
    if (!roomCode) return;
    this.socket.submitAnswer(roomCode, questionId, selectedOptionIndex, timeSeconds);
  }

  refreshState(): void {
    const roomCode = this.roomCode();
    if (!roomCode) return;
    this.socket.requestState(roomCode);
  }

  clearError(): void {
    this.socket.clearError();
  }
}

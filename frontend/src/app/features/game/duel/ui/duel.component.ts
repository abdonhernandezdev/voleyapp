import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DuelFacade } from '../data-access/duel.facade';
import { QuestionCategory } from '@shared/models/question.model';

@Component({
  selector: 'app-duel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './duel.component.html',
  styleUrls: ['./duel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DuelFacade],
})
export class DuelComponent implements OnInit, OnDestroy {
  private readonly facade = inject(DuelFacade);

  readonly state = this.facade.state;
  readonly connected = this.facade.connected;
  readonly error = this.facade.error;
  readonly user = this.facade.user;
  readonly isHost = this.facade.isHost;

  readonly joinCode = signal('');
  readonly selectedCategory = signal<QuestionCategory | ''>('');
  readonly answering = signal(false);
  readonly answeredQuestionId = signal<string | null>(null);
  readonly questionStartedAt = signal<number>(Date.now());

  readonly categories: Array<{ value: QuestionCategory; label: string }> = [
    { value: 'basic_rules', label: 'Reglamento' },
    { value: 'game_systems', label: 'Sistemas de juego' },
    { value: 'positions_roles', label: 'Posiciones y roles' },
    { value: 'rotations_k1', label: 'Rotaciones K1' },
    { value: 'rotations_k2', label: 'Rotaciones K2' },
  ];

  readonly winnerName = computed(() => {
    const state = this.state();
    if (!state?.winnerUserId) return 'Empate';
    const winner = state.players.find((player) => player.userId === state.winnerUserId);
    return winner?.displayName || 'Ganador';
  });

  constructor() {
    effect(() => {
      const currentQuestionId = this.state()?.currentQuestion?.id;
      if (!currentQuestionId) {
        this.answeredQuestionId.set(null);
        return;
      }

      if (this.answeredQuestionId() !== currentQuestionId) {
        this.answeredQuestionId.set(null);
        this.questionStartedAt.set(Date.now());
      }
    });
  }

  ngOnInit(): void {
    this.facade.init();
  }

  ngOnDestroy(): void {
    this.facade.destroy();
  }

  createRoom(): void {
    const category = this.selectedCategory() || undefined;
    this.facade.createRoom(category);
  }

  joinRoom(): void {
    const roomCode = this.joinCode().trim().toUpperCase();
    if (!roomCode) return;
    this.facade.joinRoom(roomCode);
  }

  startRoom(): void {
    this.facade.startRoom();
  }

  answer(selectedOptionIndex: number): void {
    const question = this.state()?.currentQuestion;
    if (!question || this.answering()) return;
    if (this.answeredQuestionId() === question.id) return;

    this.answering.set(true);
    const elapsedSeconds = Math.max(0, Math.round((Date.now() - this.questionStartedAt()) / 1000));
    this.facade.answer(question.id, selectedOptionIndex, elapsedSeconds);
    this.answeredQuestionId.set(question.id);
    this.answering.set(false);
  }

  isCurrentUser(userId: string): boolean {
    return this.user()?.id === userId;
  }
}

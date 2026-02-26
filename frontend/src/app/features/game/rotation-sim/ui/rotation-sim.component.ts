import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NotConfiguredComponent } from '@shared/components/not-configured/not-configured.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { HttpErrorService } from '@core/services/http-error.service';
import { NotificationService } from '@core/services/notification.service';
import { CompleteTrainingGameResponse } from '@shared/models/training.model';
import { RotationSimFacade } from '../data-access/rotation-sim.facade';
import {
  GameState,
  GameToken,
  Point,
  ROTATIONS,
  ReceptionSystem,
  SYSTEM_INFO,
  SystemInfo,
  getRotationSet,
} from '../domain/rotation-sim.models';
import { TrainingGameId } from '@shared/models/training.model';

const SYSTEM_GAME_ID: Record<ReceptionSystem, TrainingGameId> = {
  '5-1': 'reception_5_1',
  '4-2': 'reception_4_2',
  '6-2': 'reception_6_2',
};

const SYSTEM_LABEL: Record<ReceptionSystem, string> = {
  '5-1': 'Recepcion 5-1',
  '4-2': 'Recepcion 4-2',
  '6-2': 'Recepcion 6-2',
};

@Component({
  selector: 'app-rotation-sim',
  standalone: true,
  imports: [CommonModule, NotConfiguredComponent],
  templateUrl: './rotation-sim.component.html',
  styleUrls: ['./rotation-sim.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RotationSimFacade],
})
export class RotationSimComponent implements OnDestroy {
  private readonly facade = inject(RotationSimFacade);
  private readonly httpErrors = inject(HttpErrorService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly supportsDrag = true;

  readonly systemOptions: SystemInfo[] = SYSTEM_INFO;

  selectedSystem = signal<ReceptionSystem | null>(null);
  rotations = ROTATIONS;
  state = signal<GameState | 'not-configured'>('selecting');
  rotationIndex = signal(0);
  tokens = signal<GameToken[]>([]);
  selectedId = signal<number | null>(null);
  dragId = signal<number | null>(null);
  score = signal(0);
  roundPoints = signal(0);
  roundSeconds = signal(0);
  totalCorrect = signal(0);
  scorePersisted = signal(false);
  persistingScore = signal(false);
  rankingSummary = signal<CompleteTrainingGameResponse | null>(null);
  checking = signal(false);
  error = signal('');

  readonly totalSlots = computed(() => this.rotations.length * 6);
  private timer: ReturnType<typeof setInterval> | null = null;
  private startAt = 0;

  currentRotation = computed(() => this.rotations[this.rotationIndex()]);
  placedTokens = computed(() => this.tokens().filter((token) => token.position !== null));
  unplacedCount = computed(() => this.tokens().filter((token) => token.position === null).length);
  roundCorrect = computed(() => this.tokens().filter((token) => token.isCorrect === true).length);
  isLastRound = computed(() => this.rotationIndex() === this.rotations.length - 1);
  accuracy = computed(() =>
    this.totalSlots() ? Math.round((this.totalCorrect() / this.totalSlots()) * 100) : 0,
  );
  currentSystemLabel = computed(() => {
    const s = this.selectedSystem();
    return s ? SYSTEM_LABEL[s] : 'Recepcion';
  });

  ngOnDestroy() {
    this.stopTimer();
  }

  selectSystem(system: ReceptionSystem) {
    this.selectedSystem.set(system);
    this.rotations = getRotationSet(system);
    const gameKey = SYSTEM_GAME_ID[system];
    this.facade.loadConfig(gameKey)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => {
          if (!status.configured) {
            this.state.set('not-configured');
          } else {
            this.state.set('setup');
          }
        },
        error: () => this.state.set('setup'),
      });
  }

  backToSelection() {
    this.stopTimer();
    this.selectedSystem.set(null);
    this.state.set('selecting');
  }

  startGame() {
    this.error.set('');
    this.score.set(0);
    this.totalCorrect.set(0);
    this.rotationIndex.set(0);
    this.state.set('playing');
    this.scorePersisted.set(false);
    this.persistingScore.set(false);
    this.rankingSummary.set(null);
    this.loadRound();
  }

  private loadRound() {
    const rotation = this.currentRotation();
    this.tokens.set(
      rotation.players.map((player) => ({
        id: player.id,
        label: player.label,
        role: player.role,
        targetZone: player.zone,
        targetPoint: player.point,
        receiver: !!player.receiver,
        position: null,
        isCorrect: null,
      })),
    );
    this.selectedId.set(null);
    this.dragId.set(null);
    this.roundPoints.set(0);
    this.error.set('');
    this.startTimer();
  }

  private startTimer() {
    this.stopTimer();
    this.startAt = Date.now();
    this.roundSeconds.set(0);
    this.timer = setInterval(() => {
      this.roundSeconds.set(Math.floor((Date.now() - this.startAt) / 1000));
    }, 1000);
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  isFront(zone: number) {
    return zone === 4 || zone === 3 || zone === 2;
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  private getPointFromEvent(container: HTMLElement, clientX: number, clientY: number): Point {
    const rect = container.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: this.clamp(Number(x.toFixed(2)), 3, 97),
      y: this.clamp(Number(y.toFixed(2)), 10, 95),
    };
  }

  private setTokenPosition(id: number, point: Point) {
    this.tokens.update((tokens) =>
      tokens.map((token) => (token.id === id ? { ...token, position: point, isCorrect: null } : token)),
    );
  }

  selectToken(id: number) {
    if (this.state() !== 'playing' || this.checking()) return;
    this.selectedId.set(this.selectedId() === id ? null : id);
  }

  onDragStart(event: DragEvent, id: number) {
    if (this.state() !== 'playing' || this.checking()) return;
    this.dragId.set(id);
    this.selectedId.set(id);
    event.dataTransfer?.setData('text/plain', String(id));
  }

  onFieldDragOver(event: DragEvent) {
    if (this.state() !== 'playing' || this.checking()) return;
    event.preventDefault();
  }

  onFieldDrop(event: DragEvent) {
    if (this.state() !== 'playing' || this.checking()) return;
    event.preventDefault();
    const id = this.dragId() ?? this.selectedId();
    if (id === null || !event.currentTarget) return;
    const point = this.getPointFromEvent(event.currentTarget as HTMLElement, event.clientX, event.clientY);
    this.setTokenPosition(id, point);
    this.selectedId.set(null);
    this.dragId.set(null);
  }

  onFieldTap(event: MouseEvent) {
    if (this.state() !== 'playing' || this.checking()) return;
    const id = this.selectedId();
    if (id === null || !event.currentTarget) return;
    const point = this.getPointFromEvent(event.currentTarget as HTMLElement, event.clientX, event.clientY);
    this.setTokenPosition(id, point);
    this.selectedId.set(null);
  }

  onFieldTouch(event: TouchEvent) {
    if (this.state() !== 'playing' || this.checking()) return;
    const id = this.selectedId();
    const touch = event.touches.item(0);
    if (id === null || !touch || !event.currentTarget) return;
    event.preventDefault();
    const point = this.getPointFromEvent(event.currentTarget as HTMLElement, touch.clientX, touch.clientY);
    this.setTokenPosition(id, point);
    this.selectedId.set(null);
  }

  onTokenTap(event: Event, id: number) {
    event.stopPropagation();
    if (this.state() !== 'playing' || this.checking()) return;
    this.selectedId.set(this.selectedId() === id ? null : id);
  }

  resetRound() {
    if (this.state() !== 'playing' || this.checking()) return;
    this.tokens.update((tokens) => tokens.map((token) => ({ ...token, position: null, isCorrect: null })));
    this.selectedId.set(null);
    this.dragId.set(null);
    this.error.set('');
    this.startTimer();
  }

  checkRound() {
    if (this.state() !== 'playing' || this.checking() || this.unplacedCount() > 0) return;

    const tokens = this.tokens();
    const placements = tokens.map((token) => ({
      playerId: token.id,
      x: token.position!.x,
      y: token.position!.y,
    }));

    this.stopTimer();
    this.checking.set(true);
    this.error.set('');

    this.facade
      .checkRotationRound({
        rotation: this.currentRotation().rotation,
        elapsedSeconds: this.roundSeconds(),
        placements,
        system: this.selectedSystem() ?? '5-1',
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.checking.set(false)),
      )
      .subscribe({
        next: (result) => {
          const evalMap = new Map(result.perPlayer.map((entry) => [entry.playerId, entry.correct]));
          this.tokens.update((current) =>
            current.map((token) => ({ ...token, isCorrect: evalMap.get(token.id) ?? false })),
          );
          this.roundPoints.set(result.roundPoints);
          this.score.update((value) => value + result.roundPoints);
          this.totalCorrect.update((value) => value + result.correctCount);
          this.state.set('checked');
        },
        error: (err) => {
          this.error.set(this.httpErrors.getMessage(err, 'No se pudo validar la rotacion.'));
          this.startTimer();
        },
      });
  }

  nextRound() {
    if (this.state() !== 'checked') return;
    if (this.isLastRound()) {
      this.state.set('finished');
      this.persistTrainingScore();
      return;
    }
    this.rotationIndex.update((value) => value + 1);
    this.state.set('playing');
    this.loadRound();
  }

  resultTitle() {
    const score = this.score();
    if (score >= 1800) return 'Nivel top';
    if (score >= 1300) return 'Muy bien';
    if (score >= 900) return 'Buen trabajo';
    return 'Sigue practicando';
  }

  private persistTrainingScore() {
    if (this.scorePersisted() || this.persistingScore()) return;
    const system = this.selectedSystem() ?? '5-1';
    const gameId = SYSTEM_GAME_ID[system];
    const label = SYSTEM_LABEL[system];

    this.persistingScore.set(true);
    this.facade
      .completeGame({
        game: gameId,
        rawPoints: this.score(),
        roundsCompleted: this.rotations.length,
        roundsCorrect: this.totalCorrect(),
        source: 'rotation_sim_finished',
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.persistingScore.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.scorePersisted.set(true);
          this.rankingSummary.set(result);
          this.facade.refreshUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => undefined });

          if (result.unlockedAchievements?.length) {
            for (const ach of result.unlockedAchievements) {
              this.notifications.success(`Logro desbloqueado: ${ach.title} (+${ach.rewardPoints} pts)`);
            }
          }

          if (result.dailyCapApplied) {
            this.notifications.info(
              `Hoy ya puntuaste 2 veces en ${label}. Esta partida no suma al ranking.`,
            );
            return;
          }
          if (result.awardedPoints > 0) {
            this.notifications.success(`+${result.awardedPoints} puntos en ranking (${label}).`);
          } else {
            this.notifications.info('Esta partida no sumo puntos de ranking.');
          }
        },
        error: (err) => {
          this.notifications.error(
            this.httpErrors.getMessage(err, `No se pudo registrar la puntuacion de ${label}.`),
          );
        },
      });
  }
}

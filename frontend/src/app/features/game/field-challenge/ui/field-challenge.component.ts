import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotConfiguredComponent } from '@shared/components/not-configured/not-configured.component';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BASE_PLAYERS, DEFENSE_SCENARIOS, FieldPoint, PlayerToken } from '../domain/field-challenge.models';
import { HttpErrorService } from '@core/services/http-error.service';
import { NotificationService } from '@core/services/notification.service';
import { CompleteTrainingGameResponse } from '@shared/models/training.model';
import { FieldChallengeFacade } from '../data-access/field-challenge.facade';

@Component({
  selector: 'app-field-challenge',
  standalone: true,
  imports: [CommonModule, RouterLink, NotConfiguredComponent],
  templateUrl: './field-challenge.component.html',
  styleUrls: ['./field-challenge.component.scss', './field-challenge-field.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FieldChallengeFacade],
})
export class FieldChallengeComponent implements OnInit {
  private readonly facade = inject(FieldChallengeFacade);
  private readonly httpErrors = inject(HttpErrorService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly supportsDrag = true;

  scenarios = DEFENSE_SCENARIOS;
  scenarioIndex = signal(0);
  players = signal<PlayerToken[]>([]);
  gameStarted = signal(false);
  selectedPlayerId = signal<number | null>(null);
  dragPlayerId = signal<number | null>(null);
  checked = signal(false);
  gameFinished = signal(false);
  bestCorrectByScenario = signal<number[]>(Array(DEFENSE_SCENARIOS.length).fill(0));
  scorePersisted = signal(false);
  persistingScore = signal(false);
  rankingSummary = signal<CompleteTrainingGameResponse | null>(null);
  checking = signal(false);
  error = signal('');
  notConfigured = signal(false);

  scenario = computed(() => this.scenarios[this.scenarioIndex()]);
  placedPlayers = computed(() => this.players().filter((player) => player.position !== null));
  unplacedCount = computed(() => this.players().filter((player) => player.position === null).length);
  correctCount = computed(() => this.players().filter((player) => player.isCorrect === true).length);
  allCorrect = computed(() => this.correctCount() === this.players().length && this.players().length > 0);
  totalCorrectAcrossScenarios = computed(() =>
    this.bestCorrectByScenario().reduce((sum, value) => sum + value, 0),
  );
  totalScore = computed(() =>
    this.bestCorrectByScenario().reduce((sum, value) => sum + this.getScenarioPoints(value), 0),
  );

  ngOnInit() {
    this.facade.loadConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => {
          if (!status.configured) {
            this.notConfigured.set(true);
          } else {
            this.loadScenario();
          }
        },
        error: () => this.loadScenario(),
      });
  }

  startGame() {
    this.gameStarted.set(true);
    this.scenarioIndex.set(0);
    this.gameFinished.set(false);
    this.bestCorrectByScenario.set(Array(this.scenarios.length).fill(0));
    this.scorePersisted.set(false);
    this.persistingScore.set(false);
    this.rankingSummary.set(null);
    this.loadScenario();
  }

  private loadScenario() {
    this.players.set(
      BASE_PLAYERS.map((player) => ({
        ...player,
        position: null,
        isCorrect: null,
      })),
    );
    this.selectedPlayerId.set(null);
    this.dragPlayerId.set(null);
    this.checked.set(false);
    this.checking.set(false);
    this.error.set('');
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  private getPointFromEvent(container: HTMLElement, clientX: number, clientY: number): FieldPoint {
    const rect = container.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: this.clamp(Number(x.toFixed(2)), 3, 97),
      y: this.clamp(Number(y.toFixed(2)), 10, 95),
    };
  }

  private setPlayerPosition(playerId: number, point: FieldPoint) {
    this.players.update((players) =>
      players.map((player) => (player.id === playerId ? { ...player, position: point, isCorrect: null } : player)),
    );
    this.checked.set(false);
    this.error.set('');
  }

  selectPlayer(playerId: number) {
    if (this.checking()) return;
    this.selectedPlayerId.set(this.selectedPlayerId() === playerId ? null : playerId);
  }

  onDragStart(event: DragEvent, playerId: number) {
    if (this.checking()) return;
    this.dragPlayerId.set(playerId);
    this.selectedPlayerId.set(playerId);
    event.dataTransfer?.setData('text/plain', String(playerId));
  }

  onFieldDragOver(event: DragEvent) {
    if (this.checking()) return;
    event.preventDefault();
  }

  onFieldDrop(event: DragEvent) {
    if (this.checking()) return;
    event.preventDefault();
    const id = this.dragPlayerId() ?? this.selectedPlayerId();
    if (id === null || !event.currentTarget) return;
    const point = this.getPointFromEvent(event.currentTarget as HTMLElement, event.clientX, event.clientY);
    this.setPlayerPosition(id, point);
    this.selectedPlayerId.set(null);
    this.dragPlayerId.set(null);
  }

  onFieldTap(event: MouseEvent) {
    if (this.checking()) return;
    const id = this.selectedPlayerId();
    if (id === null || !event.currentTarget) return;
    const point = this.getPointFromEvent(event.currentTarget as HTMLElement, event.clientX, event.clientY);
    this.setPlayerPosition(id, point);
    this.selectedPlayerId.set(null);
  }

  onFieldTouch(event: TouchEvent) {
    if (this.checking()) return;
    const id = this.selectedPlayerId();
    const touch = event.touches.item(0);
    if (id === null || !touch || !event.currentTarget) return;
    event.preventDefault();
    const point = this.getPointFromEvent(event.currentTarget as HTMLElement, touch.clientX, touch.clientY);
    this.setPlayerPosition(id, point);
    this.selectedPlayerId.set(null);
  }

  onTokenTap(event: Event, playerId: number) {
    event.stopPropagation();
    if (this.checking()) return;
    this.selectedPlayerId.set(this.selectedPlayerId() === playerId ? null : playerId);
  }

  checkPositions() {
    if (this.unplacedCount() > 0 || this.checking()) return;

    const placements = this.players().map((player) => ({
      playerId: player.id,
      x: player.position!.x,
      y: player.position!.y,
    }));

    this.checking.set(true);
    this.error.set('');

    this.facade
      .checkDefenseZone({
        scenarioId: this.scenario().id,
        placements,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.checking.set(false)),
      )
      .subscribe({
        next: (result) => {
          const evalMap = new Map(result.perPlayer.map((entry) => [entry.playerId, entry.correct]));
          this.players.update((players) =>
            players.map((player) => ({ ...player, isCorrect: evalMap.get(player.id) ?? false })),
          );
          this.bestCorrectByScenario.update((current) => {
            const next = [...current];
            const index = this.scenarioIndex();
            const previousBest = next[index] ?? 0;
            next[index] = Math.max(previousBest, result.correctCount);
            return next;
          });
          this.checked.set(true);
        },
        error: (err) => {
          this.error.set(this.httpErrors.getMessage(err, 'No se pudo validar la defensa.'));
          this.checked.set(false);
        },
      });
  }

  resetPositions() {
    if (this.checking()) return;
    this.players.update((players) => players.map((player) => ({ ...player, position: null, isCorrect: null })));
    this.selectedPlayerId.set(null);
    this.dragPlayerId.set(null);
    this.checked.set(false);
    this.error.set('');
  }

  prevScenario() {
    if (this.checking()) return;
    if (this.scenarioIndex() > 0) {
      this.scenarioIndex.update((index) => index - 1);
      this.loadScenario();
    }
  }

  nextScenario() {
    if (this.checking()) return;
    if (this.scenarioIndex() === this.scenarios.length - 1) {
      this.gameFinished.set(true);
      this.persistTrainingScore();
      return;
    }
    this.scenarioIndex.update((index) => index + 1);
    this.loadScenario();
  }

  restartAll() {
    this.gameStarted.set(true);
    this.scenarioIndex.set(0);
    this.gameFinished.set(false);
    this.bestCorrectByScenario.set(Array(this.scenarios.length).fill(0));
    this.scorePersisted.set(false);
    this.persistingScore.set(false);
    this.rankingSummary.set(null);
    this.loadScenario();
  }

  private getScenarioPoints(correctCount: number): number {
    return correctCount * 35 + (correctCount === 6 ? 90 : 0);
  }

  private persistTrainingScore() {
    if (this.scorePersisted() || this.persistingScore()) return;

    this.persistingScore.set(true);
    this.facade
      .completeGame({
        game: 'defense_zone',
        rawPoints: this.totalScore(),
        roundsCompleted: this.scenarios.length,
        roundsCorrect: this.bestCorrectByScenario().filter((value) => value === 6).length,
        source: 'defense_zone_finished',
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
          if (result.dailyCapApplied) {
            this.notifications.info(
              'Hoy ya puntuaste 2 veces en Defensa por zona. Esta partida no suma al ranking.',
            );
            return;
          }
          if (result.awardedPoints > 0) {
            this.notifications.success(`+${result.awardedPoints} puntos en ranking (Defensa por zona).`);
          } else {
            this.notifications.info('Esta partida no sumo puntos de ranking.');
          }
        },
        error: (err) => {
          this.notifications.error(
            this.httpErrors.getMessage(err, 'No se pudo registrar la puntuacion de defensa por zona.'),
          );
        },
      });
  }

}

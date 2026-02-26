import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { NotConfiguredComponent } from '@shared/components/not-configured/not-configured.component';
import { HttpErrorService } from '@core/services/http-error.service';
import { NotificationService } from '@core/services/notification.service';
import { CompleteTrainingGameResponse } from '@shared/models/training.model';
import { RoleReceptionFacade } from '../data-access/role-reception.facade';
import { Point, RotationRole } from '../../rotation-sim/domain/rotation-sim.models';
import { RECEPTION_ROUNDS, ROLE_OPTIONS, RoleOption, RoleReceptionState } from '../domain/role-reception.models';

interface RoleToken {
  id: number;
  label: string;
  role: RotationRole;
  targetZone: number;
  targetPoint: Point;
  position: Point | null;
  isCorrect: boolean | null;
}

interface LockedRoleToken {
  id: number;
  label: string;
  role: RotationRole;
  zone: number;
  point: Point;
}

@Component({
  selector: 'app-role-reception',
  standalone: true,
  imports: [CommonModule, RouterLink, NotConfiguredComponent],
  templateUrl: './role-reception.component.html',
  styleUrls: ['./role-reception.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RoleReceptionFacade],
})
export class RoleReceptionComponent implements OnInit, OnDestroy {
  private readonly facade = inject(RoleReceptionFacade);
  private readonly httpErrors = inject(HttpErrorService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly supportsDrag = true;

  rounds = RECEPTION_ROUNDS;
  options = ROLE_OPTIONS;

  state = signal<RoleReceptionState>('setup');
  selectedRoleId = signal<number | null>(null);
  roundIndex = signal(0);
  token = signal<RoleToken | null>(null);
  tokenSelected = signal(false);
  dragActive = signal(false);
  score = signal(0);
  roundPoints = signal(0);
  roundSeconds = signal(0);
  totalCorrect = signal(0);
  scorePersisted = signal(false);
  persistingScore = signal(false);
  rankingSummary = signal<CompleteTrainingGameResponse | null>(null);
  checking = signal(false);
  error = signal('');
  notConfigured = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;
  private startAt = 0;

  currentRound = computed(() => this.rounds[this.roundIndex()]);
  selectedRole = computed<RoleOption | null>(() => {
    const id = this.selectedRoleId();
    if (id === null) return null;
    return this.options.find((option) => option.id === id) ?? null;
  });
  lockedTokens = computed<LockedRoleToken[]>(() => {
    const selectedId = this.selectedRoleId();
    if (selectedId === null) return [];

    return this.currentRound().players
      .filter((player) => player.id !== selectedId)
      .map((player) => ({
        id: player.id,
        label: player.label,
        role: player.role,
        zone: player.zone,
        point: player.point,
      }));
  });
  placedToken = computed(() => {
    const currentToken = this.token();
    return currentToken?.position ? currentToken : null;
  });
  isLastRound = computed(() => this.roundIndex() === this.rounds.length - 1);
  accuracy = computed(() => (this.rounds.length ? Math.round((this.totalCorrect() / this.rounds.length) * 100) : 0));

  ngOnInit(): void {
    this.facade.loadConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => {
          if (!status.configured) {
            this.notConfigured.set(true);
          }
        },
        error: () => {},
      });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  chooseRole(id: number): void {
    if (this.state() !== 'setup') return;
    this.selectedRoleId.set(id);
  }

  startGame(): void {
    if (!this.selectedRole()) return;
    this.error.set('');
    this.score.set(0);
    this.totalCorrect.set(0);
    this.scorePersisted.set(false);
    this.persistingScore.set(false);
    this.rankingSummary.set(null);
    this.roundIndex.set(0);
    this.state.set('playing');
    this.loadRound();
  }

  private loadRound(): void {
    const selected = this.selectedRole();
    if (!selected) return;

    const player = this.currentRound().players.find((entry) => entry.id === selected.id);
    if (!player) return;

    this.token.set({
      id: player.id,
      label: player.label,
      role: player.role,
      targetZone: player.zone,
      targetPoint: player.point,
      position: null,
      isCorrect: null,
    });
    this.tokenSelected.set(false);
    this.dragActive.set(false);
    this.roundPoints.set(0);
    this.error.set('');
    this.startTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.startAt = Date.now();
    this.roundSeconds.set(0);
    this.timer = setInterval(() => {
      this.roundSeconds.set(Math.floor((Date.now() - this.startAt) / 1000));
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  isFront(zone: number): boolean {
    return zone === 4 || zone === 3 || zone === 2;
  }

  selectToken(): void {
    if (this.state() !== 'playing' || !this.token() || this.checking()) return;
    this.tokenSelected.set(!this.tokenSelected());
  }

  onDragStart(event: DragEvent): void {
    if (this.state() !== 'playing' || !this.token() || this.checking()) return;
    this.dragActive.set(true);
    this.tokenSelected.set(true);
    event.dataTransfer?.setData('text/plain', 'role-token');
  }

  onFieldDragOver(event: DragEvent): void {
    if (this.state() !== 'playing' || this.checking()) return;
    event.preventDefault();
  }

  onFieldDrop(event: DragEvent): void {
    if (this.state() !== 'playing' || !event.currentTarget || this.checking()) return;
    event.preventDefault();
    const point = this.getPointFromEvent(event.currentTarget as HTMLElement, event.clientX, event.clientY);
    this.setTokenPosition(point);
    this.dragActive.set(false);
    this.tokenSelected.set(false);
  }

  onFieldTap(event: MouseEvent): void {
    if (this.state() !== 'playing' || !this.tokenSelected() || !event.currentTarget || this.checking()) return;
    const point = this.getPointFromEvent(event.currentTarget as HTMLElement, event.clientX, event.clientY);
    this.setTokenPosition(point);
    this.tokenSelected.set(false);
  }

  onFieldTouch(event: TouchEvent): void {
    if (this.state() !== 'playing' || !this.tokenSelected() || !event.currentTarget || this.checking()) return;
    const touch = event.touches.item(0);
    if (!touch) return;
    event.preventDefault();
    const point = this.getPointFromEvent(event.currentTarget as HTMLElement, touch.clientX, touch.clientY);
    this.setTokenPosition(point);
    this.tokenSelected.set(false);
  }

  onTokenTap(event: Event): void {
    event.stopPropagation();
    if (this.state() !== 'playing' || this.checking()) return;
    this.tokenSelected.set(!this.tokenSelected());
  }

  resetRound(): void {
    if (this.state() !== 'playing' || this.checking()) return;
    this.token.update((token) => (token ? { ...token, position: null, isCorrect: null } : null));
    this.tokenSelected.set(false);
    this.dragActive.set(false);
    this.roundPoints.set(0);
    this.error.set('');
    this.startTimer();
  }

  checkRound(): void {
    const currentToken = this.token();
    if (this.state() !== 'playing' || !currentToken?.position || this.checking()) return;

    this.stopTimer();
    this.checking.set(true);
    this.error.set('');

    this.facade
      .checkRoleReception({
        rotation: this.currentRound().rotation,
        roleId: currentToken.id,
        elapsedSeconds: this.roundSeconds(),
        placement: currentToken.position,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.checking.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.token.update((token) => (token ? { ...token, isCorrect: result.correct } : null));
          this.roundPoints.set(result.roundPoints);
          this.score.update((value) => value + result.roundPoints);
          if (result.correct) {
            this.totalCorrect.update((value) => value + 1);
          }
          this.state.set('checked');
        },
        error: (err) => {
          this.error.set(this.httpErrors.getMessage(err, 'No se pudo validar la posicion.'));
          this.startTimer();
        },
      });
  }

  nextRound(): void {
    if (this.state() !== 'checked') return;
    if (this.isLastRound()) {
      this.state.set('finished');
      this.persistTrainingScore();
      return;
    }
    this.roundIndex.update((value) => value + 1);
    this.state.set('playing');
    this.loadRound();
  }

  playAgain(): void {
    this.state.set('setup');
    this.roundIndex.set(0);
    this.score.set(0);
    this.totalCorrect.set(0);
    this.roundPoints.set(0);
    this.roundSeconds.set(0);
    this.token.set(null);
    this.tokenSelected.set(false);
    this.dragActive.set(false);
    this.checking.set(false);
    this.scorePersisted.set(false);
    this.persistingScore.set(false);
    this.rankingSummary.set(null);
    this.error.set('');
    this.stopTimer();
  }

  resultTitle(): string {
    const score = this.score();
    if (score >= 470) return 'Nivel experto';
    if (score >= 330) return 'Muy buen trabajo';
    if (score >= 210) return 'Buen progreso';
    return 'Sigue entrenando';
  }

  private setTokenPosition(point: Point): void {
    this.token.update((token) => (token ? { ...token, position: point, isCorrect: null } : null));
  }

  private clamp(value: number, min: number, max: number): number {
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

  private persistTrainingScore(): void {
    if (this.scorePersisted() || this.persistingScore()) return;

    this.persistingScore.set(true);
    this.facade
      .completeGame({
        game: 'role_reception',
        rawPoints: this.score(),
        roundsCompleted: this.rounds.length,
        roundsCorrect: this.totalCorrect(),
        source: 'role_reception_finished',
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
          if (result.awardedPoints > 0) {
            this.notifications.success(`+${result.awardedPoints} puntos en ranking (Recepcion por rol).`);
          } else {
            this.notifications.info('Esta partida no sumo puntos de ranking.');
          }
        },
        error: (err) => {
          this.notifications.error(
            this.httpErrors.getMessage(err, 'No se pudo registrar la puntuacion de recepcion por rol.'),
          );
        },
      });
  }

}

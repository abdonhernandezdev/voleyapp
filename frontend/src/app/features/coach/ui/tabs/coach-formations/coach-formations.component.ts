import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { HttpErrorService } from '@core/services/http-error.service';
import { AllConfigStatus, ConfigStatus, ZoneConfig } from '@shared/models/formation-config.model';
import { FormationEditorComponent, PlayerLabel } from '../../formation-editor/formation-editor.component';
import { CoachFormationsFacade } from '../../../data-access/coach-formations.facade';

interface GameOption {
  key: string;
  label: string;
  family: string;
  system: string | null;
  rotationCount: number;
}

const PLAYER_LABELS_BY_GAME: Record<string, PlayerLabel[]> = {
  reception_5_1: [
    { id: 1, role: 'Colocador',   color: '#c8102e' },
    { id: 2, role: 'Central 1',  color: '#1565c0' },
    { id: 3, role: 'Central 2',  color: '#1565c0' },
    { id: 4, role: 'Receptor 1', color: '#2e7d32' },
    { id: 5, role: 'Receptor 2', color: '#2e7d32' },
    { id: 6, role: 'Opuesto',    color: '#b71c1c' },
  ],
  reception_4_2: [
    { id: 1, role: 'Colocador 1', color: '#c8102e' },
    { id: 2, role: 'Colocador 2', color: '#c8102e' },
    { id: 3, role: 'Receptor 1',  color: '#2e7d32' },
    { id: 4, role: 'Receptor 2',  color: '#2e7d32' },
    { id: 5, role: 'Central 1',   color: '#1565c0' },
    { id: 6, role: 'Central 2',   color: '#1565c0' },
  ],
  reception_6_2: [
    { id: 1, role: 'Colocador 1', color: '#c8102e' },
    { id: 2, role: 'Colocador 2', color: '#c8102e' },
    { id: 3, role: 'Receptor 1',  color: '#2e7d32' },
    { id: 4, role: 'Receptor 2',  color: '#2e7d32' },
    { id: 5, role: 'Central 1',   color: '#1565c0' },
    { id: 6, role: 'Central 2',   color: '#1565c0' },
  ],
  defense: [
    { id: 1, role: 'Colocador',  color: '#c8102e' },
    { id: 2, role: 'Central 1', color: '#1565c0' },
    { id: 3, role: 'Central 2', color: '#1565c0' },
    { id: 4, role: 'Receptor 1', color: '#2e7d32' },
    { id: 5, role: 'Receptor 2', color: '#2e7d32' },
    { id: 6, role: 'Opuesto',    color: '#b71c1c' },
  ],
};

const GAME_OPTIONS: GameOption[] = [
  { key: 'reception_5_1', label: 'Recepcion 5-1', family: 'reception', system: '5-1', rotationCount: 6 },
  { key: 'reception_4_2', label: 'Recepcion 4-2', family: 'reception', system: '4-2', rotationCount: 6 },
  { key: 'reception_6_2', label: 'Recepcion 6-2', family: 'reception', system: '6-2', rotationCount: 6 },
  { key: 'defense', label: 'Defensa por zona', family: 'defense', system: null, rotationCount: 3 },
];

@Component({
  selector: 'app-coach-formations',
  standalone: true,
  imports: [CommonModule, FormationEditorComponent],
  templateUrl: './coach-formations.component.html',
  styleUrls: ['../../coach.component.scss', './coach-formations.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoachFormationsComponent implements OnInit {
  private readonly facade = inject(CoachFormationsFacade);
  private readonly httpError = inject(HttpErrorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly gameOptions = GAME_OPTIONS;
  readonly allConfigStatus = signal<AllConfigStatus | null>(null);
  readonly selectedGameKey = signal<string>('reception_5_1');
  readonly selectedRotationIdx = signal<number>(0);
  readonly currentZones = signal<ZoneConfig[]>([]);
  readonly currentPlayerLabels = signal<PlayerLabel[]>([]);
  readonly savingZones = signal(false);
  readonly loadingZones = signal(false);
  readonly formationError = signal<string | null>(null);
  readonly formationSuccess = signal(false);

  ngOnInit(): void {
    this.loadFormationStatus();
    this.currentPlayerLabels.set(this.buildPlayerLabels(GAME_OPTIONS[0]));
    this.loadRotationZones(0);
  }

  loadFormationStatus(): void {
    this.facade.getAllStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => this.allConfigStatus.set(status),
        error: () => {},
      });
  }

  selectGame(key: string): void {
    this.selectedGameKey.set(key);
    this.selectedRotationIdx.set(0);
    this.loadRotationZones(0);
  }

  selectRotation(idx: number): void {
    this.selectedRotationIdx.set(idx);
    this.loadRotationZones(idx);
  }

  onZonesChange(zones: ZoneConfig[]): void {
    this.currentZones.set(zones);
  }

  saveZones(): void {
    const zones = this.currentZones();
    if (zones.length === 0) return;
    const game = GAME_OPTIONS.find((g) => g.key === this.selectedGameKey());
    if (!game) return;
    const idx = this.selectedRotationIdx();
    this.savingZones.set(true);
    this.formationError.set(null);
    this.formationSuccess.set(false);
    this.facade
      .saveRotationZones(game.family, game.system, idx, zones)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.savingZones.set(false)),
      )
      .subscribe({
        next: () => {
          this.formationSuccess.set(true);
          this.loadFormationStatus();
          setTimeout(() => this.formationSuccess.set(false), 3000);
        },
        error: (err: unknown) => {
          this.formationError.set(this.httpError.getMessage(err, 'No se pudieron guardar las zonas.'));
        },
      });
  }

  getConfigStatus(key: string): ConfigStatus | null {
    const status = this.allConfigStatus();
    if (!status) return null;
    return (status as unknown as Record<string, ConfigStatus>)[key] ?? null;
  }

  getRotationLabel(game: GameOption, idx: number): string {
    if (game.family === 'defense') return `E${idx + 1}`;
    return `R${idx + 1}`;
  }

  getRotationIndices(): number[] {
    const game = GAME_OPTIONS.find((g) => g.key === this.selectedGameKey());
    const count = game?.rotationCount ?? 6;
    return Array.from({ length: count }, (_, i) => i);
  }

  getSelectedGame(): GameOption {
    return GAME_OPTIONS.find((g) => g.key === this.selectedGameKey()) ?? GAME_OPTIONS[0];
  }

  private loadRotationZones(idx: number): void {
    const game = GAME_OPTIONS.find((g) => g.key === this.selectedGameKey());
    if (!game) return;
    this.loadingZones.set(true);
    this.formationError.set(null);
    this.facade
      .getRotationZones(game.family, game.system, idx)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingZones.set(false)),
      )
      .subscribe({
        next: (zones) => {
          this.currentZones.set(zones.length === 6 ? zones : this.buildDefaultZones(game));
          this.currentPlayerLabels.set(this.buildPlayerLabels(game));
        },
        error: () => {
          this.currentZones.set(this.buildDefaultZones(game));
          this.currentPlayerLabels.set(this.buildPlayerLabels(game));
        },
      });
  }

  private buildDefaultZones(game: GameOption): ZoneConfig[] {
    return Array.from({ length: 6 }, (_, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      return {
        playerId: i + 1,
        x: 5 + col * 31,
        y: row === 0 ? 12 : 52,
        w: 28,
        h: 35,
      };
    });
  }

  private buildPlayerLabels(game: GameOption): PlayerLabel[] {
    return (
      PLAYER_LABELS_BY_GAME[game.key] ??
      Array.from({ length: 6 }, (_, i) => ({ id: i + 1, role: `J${i + 1}`, color: '#888' }))
    );
  }
}

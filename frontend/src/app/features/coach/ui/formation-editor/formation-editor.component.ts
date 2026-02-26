import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZoneConfig } from '@shared/models/formation-config.model';

export interface PlayerLabel {
  id: number;
  role: string;
  color: string;
}

type DragMode = 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br';

interface DragState {
  playerId: number;
  mode: DragMode;
  startMouseX: number;
  startMouseY: number;
  startZone: ZoneConfig;
}

const MIN_SIZE = 5;

@Component({
  selector: 'app-formation-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formation-editor.component.html',
  styleUrls: ['./formation-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormationEditorComponent implements OnChanges {
  @Input() initialZones: ZoneConfig[] = [];
  @Input() playerLabels: PlayerLabel[] = [];
  @Output() zonesChange = new EventEmitter<ZoneConfig[]>();

  zones = signal<ZoneConfig[]>([]);

  private dragging: DragState | null = null;
  private containerRect: DOMRect | null = null;

  ngOnChanges(): void {
    if (this.initialZones.length > 0) {
      this.zones.set(this.initialZones.map((z) => ({ ...z })));
    }
  }

  colorFor(playerId: number): string {
    return this.playerLabels.find((p) => p.id === playerId)?.color ?? '#888';
  }

  labelFor(playerId: number): string {
    const pl = this.playerLabels.find((p) => p.id === playerId);
    return pl?.role ?? `J${playerId}`;
  }

  onMouseDown(event: MouseEvent, playerId: number, mode: DragMode): void {
    event.preventDefault();
    event.stopPropagation();
    const container = (event.currentTarget as HTMLElement).closest('.court-field') as HTMLElement;
    if (container) {
      this.containerRect = container.getBoundingClientRect();
    }
    const zone = this.zones().find((z) => z.playerId === playerId);
    if (!zone) return;
    this.dragging = {
      playerId,
      mode,
      startMouseX: event.clientX,
      startMouseY: event.clientY,
      startZone: { ...zone },
    };
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.dragging || !this.containerRect) return;
    event.preventDefault();
    this.applyDelta(event.clientX, event.clientY);
  }

  onMouseUp(): void {
    if (!this.dragging) return;
    this.dragging = null;
    this.zonesChange.emit(this.zones());
  }

  onTouchStart(event: TouchEvent, playerId: number, mode: DragMode): void {
    event.stopPropagation();
    const touch = event.touches.item(0);
    if (!touch) return;
    const container = (event.currentTarget as HTMLElement).closest('.court-field') as HTMLElement;
    if (container) {
      this.containerRect = container.getBoundingClientRect();
    }
    const zone = this.zones().find((z) => z.playerId === playerId);
    if (!zone) return;
    this.dragging = {
      playerId,
      mode,
      startMouseX: touch.clientX,
      startMouseY: touch.clientY,
      startZone: { ...zone },
    };
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.dragging || !this.containerRect) return;
    event.preventDefault();
    const touch = event.touches.item(0);
    if (!touch) return;
    this.applyDelta(touch.clientX, touch.clientY);
  }

  onTouchEnd(): void {
    if (!this.dragging) return;
    this.dragging = null;
    this.zonesChange.emit(this.zones());
  }

  private applyDelta(clientX: number, clientY: number): void {
    if (!this.dragging || !this.containerRect) return;
    const rect = this.containerRect;
    const dxPx = clientX - this.dragging.startMouseX;
    const dyPx = clientY - this.dragging.startMouseY;
    const dx = (dxPx / rect.width) * 100;
    const dy = (dyPx / rect.height) * 100;

    const s = this.dragging.startZone;
    let { x, y, w, h } = s;

    switch (this.dragging.mode) {
      case 'move':
        x = s.x + dx;
        y = s.y + dy;
        break;
      case 'resize-tl':
        x = s.x + dx;
        y = s.y + dy;
        w = s.w - dx;
        h = s.h - dy;
        break;
      case 'resize-tr':
        y = s.y + dy;
        w = s.w + dx;
        h = s.h - dy;
        break;
      case 'resize-bl':
        x = s.x + dx;
        w = s.w - dx;
        h = s.h + dy;
        break;
      case 'resize-br':
        w = s.w + dx;
        h = s.h + dy;
        break;
    }

    // Enforce minimum size
    w = Math.max(MIN_SIZE, w);
    h = Math.max(MIN_SIZE, h);

    // Clamp to 0–100
    x = Math.max(0, Math.min(100 - w, x));
    y = Math.max(0, Math.min(100 - h, y));

    const playerId = this.dragging.playerId;
    this.zones.update((zones) =>
      zones.map((z) => (z.playerId === playerId ? { ...z, x, y, w, h } : z)),
    );
  }
}

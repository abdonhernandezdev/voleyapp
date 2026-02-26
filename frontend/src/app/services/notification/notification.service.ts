import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
  title?: string;
  durationMs: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _items = signal<AppNotification[]>([]);
  readonly items = this._items.asReadonly();

  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  success(message: string, title = 'Completado', durationMs = 3200): void {
    this.push({ type: 'success', title, message, durationMs });
  }

  info(message: string, title = 'Info', durationMs = 3200): void {
    this.push({ type: 'info', title, message, durationMs });
  }

  warning(message: string, title = 'Atencion', durationMs = 4000): void {
    this.push({ type: 'warning', title, message, durationMs });
  }

  error(message: string, title = 'Error', durationMs = 4800): void {
    this.push({ type: 'error', title, message, durationMs });
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this._items.update((items) => items.filter((item) => item.id !== id));
  }

  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this._items.set([]);
  }

  private push(payload: Omit<AppNotification, 'id'>): void {
    const id = this.nextId++;
    const item: AppNotification = {
      id,
      ...payload,
    };

    this._items.update((items) => [...items, item]);

    const timer = setTimeout(() => {
      this.dismiss(id);
    }, item.durationMs);
    this.timers.set(id, timer);
  }
}

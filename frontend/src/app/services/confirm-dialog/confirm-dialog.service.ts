import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'danger' | 'default';
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  confirmText: string;
  cancelText: string;
  tone: 'danger' | 'default';
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly _state = signal<ConfirmDialogState | null>(null);
  readonly state = this._state.asReadonly();

  private resolver: ((result: boolean) => void) | null = null;

  open(options: ConfirmDialogOptions): Promise<boolean> {
    this.resolvePending(false);

    this._state.set({
      ...options,
      confirmText: options.confirmText ?? 'Confirmar',
      cancelText: options.cancelText ?? 'Cancelar',
      tone: options.tone ?? 'default',
    });

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  confirm(): void {
    this.resolvePending(true);
  }

  cancel(): void {
    this.resolvePending(false);
  }

  private resolvePending(result: boolean): void {
    if (this.resolver) {
      const resolve = this.resolver;
      this.resolver = null;
      resolve(result);
    }
    this._state.set(null);
  }
}

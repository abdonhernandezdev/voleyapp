import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class HttpErrorService {
  private readonly _globalError = signal<string | null>(null);
  readonly globalError = this._globalError.asReadonly();

  getMessage(error: unknown, fallback = 'Ha ocurrido un error inesperado.'): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    const payload = error.error as { message?: string | string[] } | string | null;

    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.message) && payload.message.length > 0) {
        return payload.message.join('. ');
      }
      if (typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message;
      }
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Revisa la conexion e intentalo otra vez.';
    }

    if (error.status >= 500) {
      return 'Error interno del servidor. Intentalo de nuevo en unos minutos.';
    }

    if (error.status === 404) {
      return 'No se encontro el recurso solicitado.';
    }

    if (error.status === 403) {
      return 'No tienes permisos para realizar esta accion.';
    }

    if (error.status === 401) {
      return 'Tu sesion no es valida. Inicia sesion de nuevo.';
    }

    return fallback;
  }

  reportGlobal(error: unknown, fallback?: string): void {
    this._globalError.set(this.getMessage(error, fallback));
  }

  clearGlobal(): void {
    this._globalError.set(null);
  }
}

import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HttpErrorService } from './http-error.service';

describe('HttpErrorService', () => {
  let service: HttpErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpErrorService],
    });
    service = TestBed.inject(HttpErrorService);
  });

  it('returns fallback for non-http errors', () => {
    expect(service.getMessage(new Error('boom'), 'fallback')).toBe('fallback');
  });

  it('returns message when payload is string', () => {
    const error = new HttpErrorResponse({ status: 400, error: 'Mensaje directo' });
    expect(service.getMessage(error)).toBe('Mensaje directo');
  });

  it('returns joined messages when payload.message is array', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: ['uno', 'dos'] },
    });
    expect(service.getMessage(error)).toBe('uno. dos');
  });

  it('returns message when payload.message is string', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Payload message' },
    });
    expect(service.getMessage(error)).toBe('Payload message');
  });

  it('maps well-known status codes', () => {
    expect(service.getMessage(new HttpErrorResponse({ status: 0 }))).toContain('No se pudo conectar');
    expect(service.getMessage(new HttpErrorResponse({ status: 500 }))).toContain('Error interno del servidor');
    expect(service.getMessage(new HttpErrorResponse({ status: 404 }))).toContain('No se encontro');
    expect(service.getMessage(new HttpErrorResponse({ status: 403 }))).toContain('No tienes permisos');
    expect(service.getMessage(new HttpErrorResponse({ status: 401 }))).toContain('Tu sesion no es valida');
  });

  it('stores and clears global error', () => {
    const error = new HttpErrorResponse({ status: 500 });
    service.reportGlobal(error);
    expect(service.globalError()).toContain('Error interno del servidor');
    service.clearGlobal();
    expect(service.globalError()).toBeNull();
  });
});


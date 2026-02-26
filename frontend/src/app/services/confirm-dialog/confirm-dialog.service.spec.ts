import { TestBed } from '@angular/core/testing';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfirmDialogService],
    });
    service = TestBed.inject(ConfirmDialogService);
  });

  it('opens with defaults and resolves true on confirm', async () => {
    const resultPromise = service.open({
      title: 'Confirmar',
      message: 'Seguro?',
    });

    expect(service.state()).toMatchObject({
      title: 'Confirmar',
      message: 'Seguro?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      tone: 'default',
    });

    service.confirm();
    await expect(resultPromise).resolves.toBe(true);
    expect(service.state()).toBeNull();
  });

  it('resolves false on cancel', async () => {
    const resultPromise = service.open({
      title: 'Cancelar',
      message: 'No?',
      tone: 'danger',
      confirmText: 'Si',
      cancelText: 'No',
    });
    service.cancel();
    await expect(resultPromise).resolves.toBe(false);
    expect(service.state()).toBeNull();
  });

  it('resolves previous pending promise as false when opening a new dialog', async () => {
    const first = service.open({ title: 'A', message: 'A' });
    const second = service.open({ title: 'B', message: 'B' });
    service.confirm();

    await expect(first).resolves.toBe(false);
    await expect(second).resolves.toBe(true);
  });
});


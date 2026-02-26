import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    service.clear();
  });

  it('adds success/info/warning/error notifications', () => {
    service.success('ok');
    service.info('info');
    service.warning('warn');
    service.error('err');

    const items = service.items();
    expect(items).toHaveLength(4);
    expect(items[0].type).toBe('success');
    expect(items[1].type).toBe('info');
    expect(items[2].type).toBe('warning');
    expect(items[3].type).toBe('error');
  });

  it('dismisses by id', () => {
    service.success('one');
    const id = service.items()[0].id;
    service.dismiss(id);
    expect(service.items()).toHaveLength(0);
  });

  it('clears all notifications', () => {
    service.success('one');
    service.warning('two');
    service.clear();
    expect(service.items()).toEqual([]);
  });

  it('auto dismisses after duration', fakeAsync(() => {
    service.success('short', 'title', 100);
    expect(service.items()).toHaveLength(1);
    tick(99);
    expect(service.items()).toHaveLength(1);
    tick(1);
    expect(service.items()).toHaveLength(0);
  }));
});


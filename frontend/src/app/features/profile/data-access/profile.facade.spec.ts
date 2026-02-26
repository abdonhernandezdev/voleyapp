import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AchievementsApiService } from '@core/services/data-access/achievements-api.service';
import { UsersApiService } from '@core/services/data-access/users-api.service';
import { AuthService } from '@core/services/auth.service';
import { ProfileFacade } from './profile.facade';

describe('ProfileFacade', () => {
  let facade: ProfileFacade;
  let usersApi: { getMe: jest.Mock; updateMe: jest.Mock };
  let achievementsApi: { getMine: jest.Mock };
  let auth: { refreshUser: jest.Mock };

  beforeEach(() => {
    usersApi = {
      getMe: jest.fn(),
      updateMe: jest.fn(),
    };
    achievementsApi = {
      getMine: jest.fn(),
    };
    auth = {
      refreshUser: jest.fn(() => of({})),
    };

    TestBed.configureTestingModule({
      providers: [
        ProfileFacade,
        { provide: UsersApiService, useValue: usersApi },
        { provide: AchievementsApiService, useValue: achievementsApi },
        { provide: AuthService, useValue: auth },
      ],
    });
    facade = TestBed.inject(ProfileFacade);
  });

  it('loads profile and achievements', () => {
    usersApi.getMe.mockReturnValue(of({ id: 'u1', displayName: 'A' }));
    achievementsApi.getMine.mockReturnValue(of([{ id: 'a1' }]));

    facade.load();

    expect(facade.user()).toEqual({ id: 'u1', displayName: 'A' } as never);
    expect(facade.achievements()).toEqual([{ id: 'a1' } as never]);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  it('handles load error', () => {
    usersApi.getMe.mockReturnValue(throwError(() => new Error('boom')));
    achievementsApi.getMine.mockReturnValue(of([]));

    facade.load();

    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBe('No se pudo cargar el perfil.');
  });

  it('saves profile and refreshes auth user', () => {
    usersApi.updateMe.mockReturnValue(of({ id: 'u1', displayName: 'Nuevo' }));
    facade.save({ displayName: 'Nuevo' });

    expect(usersApi.updateMe).toHaveBeenCalledWith({ displayName: 'Nuevo' });
    expect(facade.user()).toEqual({ id: 'u1', displayName: 'Nuevo' } as never);
    expect(facade.saveMessage()).toBe('Perfil actualizado.');
    expect(auth.refreshUser).toHaveBeenCalled();
    expect(facade.saving()).toBe(false);
  });

  it('handles save error', () => {
    usersApi.updateMe.mockReturnValue(throwError(() => new Error('boom')));
    facade.save({ displayName: 'No' });
    expect(facade.error()).toBe('No se pudo guardar el perfil.');
    expect(facade.saving()).toBe(false);
  });
});


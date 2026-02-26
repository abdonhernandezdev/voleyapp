import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { coachGuard } from '@core/guards/coach.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/ui/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'game',
    canActivate: [authGuard],
    children: [
      {
        path: 'quiz',
        loadComponent: () =>
          import('./features/game/quiz/ui/quiz.component').then(
            (m) => m.QuizComponent
          ),
      },
      {
        path: 'field-challenge',
        loadComponent: () =>
          import('./features/game/field-challenge/ui/field-challenge.component').then(
            (m) => m.FieldChallengeComponent
          ),
      },
      {
        path: 'rotation',
        loadComponent: () =>
          import('./features/game/rotation-sim/ui/rotation-sim.component').then(
            (m) => m.RotationSimComponent
          ),
      },
      {
        path: 'role-reception',
        loadComponent: () =>
          import('./features/game/role-reception/ui/role-reception.component').then(
            (m) => m.RoleReceptionComponent
          ),
      },
      {
        path: 'role-defense',
        loadComponent: () =>
          import('./features/game/role-defense/ui/role-defense.component').then(
            (m) => m.RoleDefenseComponent
          ),
      },
      {
        path: 'duel',
        loadComponent: () =>
          import('./features/game/duel/ui/duel.component').then(
            (m) => m.DuelComponent
          ),
      },
    ],
  },
  {
    path: 'rewards',
    loadComponent: () =>
      import('./features/rewards/ui/rewards.component').then(
        (m) => m.RewardsComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'ranking',
    loadComponent: () =>
      import('./features/ranking/ui/ranking.component').then(
        (m) => m.RankingComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/ui/profile.component').then(
        (m) => m.ProfileComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'coach',
    loadComponent: () =>
      import('./features/coach/ui/coach.component').then(
        (m) => m.CoachComponent
      ),
    canActivate: [authGuard, coachGuard],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

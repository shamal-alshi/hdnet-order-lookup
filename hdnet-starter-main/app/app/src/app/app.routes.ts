import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login').then(
        (module) => module.Login,
      ),
  },
  {
    path: 'orders',
    canActivate: [authGuard, roleGuard('HDNet Viewer')],
    loadComponent: () =>
      import('./features/orders/orders-page/orders-page').then(
        (module) => module.OrdersPage,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Role } from '../shared/models';
import { AuthStore } from './auth.store';

export const roleGuard = (role: Role): CanActivateFn => () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  return auth.hasRole(role)
    ? true
    : router.createUrlTree(['/orders']);
};
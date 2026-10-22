import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthStore } from './auth.store';

describe('authGuard', () => {
  it('redirects signed-out users to login', () => {
    const router = {
      createUrlTree: vi.fn(() => ({}) as UrlTree),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: { isSignedIn: () => false } },
        { provide: Router, useValue: router },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard(null!, null!));

    expect(result).toBe(router.createUrlTree.mock.results[0].value);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});

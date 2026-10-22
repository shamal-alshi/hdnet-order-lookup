import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';

import {
  AuthSession,
  LoginCredentials,
  LoginResponse,
  Role,
} from '../shared/models';
import { environment } from '../../environments/environment';

const sessionKey = 'hdnet.session';

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const value = sessionStorage.getItem(sessionKey);

    if (!value) {
      return null;
    }

    const session = JSON.parse(value) as AuthSession;

    if (
      typeof session.accessToken !== 'string' ||
      !session.user ||
      !Array.isArray(session.user.roles)
    ) {
      sessionStorage.removeItem(sessionKey);
      return null;
    }

    return session;
  } catch {
    sessionStorage.removeItem(sessionKey);
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly http = inject(HttpClient);
  private readonly sessionState = signal<AuthSession | null>(readStoredSession());

  readonly session = this.sessionState.asReadonly();
  readonly user = computed(() => this.sessionState()?.user ?? null);
  readonly accessToken = computed(
    () => this.sessionState()?.accessToken ?? null,
  );
  readonly isSignedIn = computed(() => this.sessionState() !== null);

  login(credentials: LoginCredentials) {
    return this.http
      .post<LoginResponse>(
        `${environment.apiBaseUrl}/auth/login`,
        credentials,
      )
      .pipe(
        tap((response) => {
          const session: AuthSession = {
            accessToken: response.accessToken,
            user: response.user,
          };

          this.sessionState.set(session);
          sessionStorage.setItem(sessionKey, JSON.stringify(session));
        }),
      );
  }

  hasRole(role: Role): boolean {
    return this.user()?.roles.includes(role) ?? false;
  }

  clearSession(): void {
    this.sessionState.set(null);

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(sessionKey);
    }
  }
}
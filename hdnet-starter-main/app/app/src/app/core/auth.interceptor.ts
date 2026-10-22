import {
    HttpErrorResponse,
    HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthStore } from './auth.store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
    const auth = inject(AuthStore);
    const router = inject(Router);

    const isApiRequest = request.url.startsWith(environment.apiBaseUrl);
    const isLoginRequest = request.url === `${environment.apiBaseUrl}/auth/login`;
    const token = auth.accessToken();

    const authenticatedRequest =
        isApiRequest && !isLoginRequest && token
            ? request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`,
                },
            })
            : request;

    return next(authenticatedRequest).pipe(
        catchError((error: HttpErrorResponse) => {
            if (isApiRequest && !isLoginRequest && error.status === 401) {
                auth.clearSession();
                void router.navigateByUrl('/login');
            }

            return throwError(() => error);
        }),
    );
};
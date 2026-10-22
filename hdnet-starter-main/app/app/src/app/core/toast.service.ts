import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
/** Provides consistent, unobtrusive feedback for completed and failed actions. */
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  error(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: 'toast-error',
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  success(message: string): void {
    this.snackBar.open(message, undefined, {
      duration: 3500,
      panelClass: 'toast-success',
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}

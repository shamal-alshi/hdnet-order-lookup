import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import { ApiError, CancelReason, Order } from '../../../shared/models';
import { OrdersApi } from '../orders.api';
import { ToastService } from '../../../core/toast.service';

const cancelReasons: { value: CancelReason; label: string }[] = [
  { value: 'CUSTOMER_REQUEST', label: 'Customer Request' },
  { value: 'DUPLICATE_ORDER', label: 'Duplicate Order' },
  { value: 'ADDRESS_ISSUE', label: 'Address Issue' },
  { value: 'OTHER', label: 'Other' },
];

@Component({
  selector: 'app-cancel-order-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './cancel-order-dialog.html',
  styleUrl: './cancel-order-dialog.scss',
})
/** Collects a cancellation reason and keeps the dialog open when the API rejects it. */
export class CancelOrderDialogComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly api = inject(OrdersApi);
  private readonly dialogRef = inject(MatDialogRef<CancelOrderDialogComponent>);
  private readonly toast = inject(ToastService);

  protected readonly order = inject<Order>(MAT_DIALOG_DATA);
  protected readonly reasons = cancelReasons;
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = this.formBuilder.group({
    reason: this.formBuilder.control<CancelReason | null>(null, Validators.required),
  });

  protected cancelOrder(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    this.api
      .cancelOrder(this.order.orderNumber, this.form.getRawValue().reason!)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (order) => this.dialogRef.close(order),
        error: (error: HttpErrorResponse) => {
          const message =
            (error.error as ApiError | undefined)?.message ??
            'The order could not be cancelled. Please try again.';
          this.errorMessage.set(message);
          this.toast.error(message);
        },
      });
  }
}

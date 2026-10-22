import { of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OrdersApi } from '../orders.api';
import { CancelOrderDialogComponent } from './cancel-order-dialog';
import { Order } from '../../../shared/models';
import { ToastService } from '../../../core/toast.service';

const order: Order = {
  orderNumber: 'HD100312',
  orderDate: '2026-10-08',
  status: 'RECEIVED',
  rxCount: 3,
  shipToState: 'IL',
  lastUpdated: '2026-10-08T10:00:00.000Z',
};

describe('CancelOrderDialogComponent', () => {
  const dialogRef = { close: vi.fn() };
  const ordersApi = { cancelOrder: vi.fn() };
  const toast = { error: vi.fn() };

  beforeEach(async () => {
    dialogRef.close.mockReset();
    ordersApi.cancelOrder.mockReset();
    toast.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [CancelOrderDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: order },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: OrdersApi, useValue: ordersApi },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();
  });

  it('closes with the updated order when cancellation succeeds', () => {
    const updatedOrder = { ...order, status: 'CANCELLED' as const };
    ordersApi.cancelOrder.mockReturnValue(of(updatedOrder));
    const component = TestBed.createComponent(CancelOrderDialogComponent).componentInstance;

    component['form'].controls.reason.setValue('CUSTOMER_REQUEST');
    component['cancelOrder']();

    expect(ordersApi.cancelOrder).toHaveBeenCalledWith('HD100312', 'CUSTOMER_REQUEST');
    expect(dialogRef.close).toHaveBeenCalledWith(updatedOrder);
  });

  it('keeps the dialog open and shows the API message when cancellation fails', () => {
    ordersApi.cancelOrder.mockReturnValue(
      throwError(() => ({ error: { message: 'Order can no longer be cancelled.' } })),
    );
    const component = TestBed.createComponent(CancelOrderDialogComponent).componentInstance;

    component['form'].controls.reason.setValue('CUSTOMER_REQUEST');
    component['cancelOrder']();

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component['errorMessage']()).toBe('Order can no longer be cancelled.');
    expect(toast.error).toHaveBeenCalledWith('Order can no longer be cancelled.');
  });
});

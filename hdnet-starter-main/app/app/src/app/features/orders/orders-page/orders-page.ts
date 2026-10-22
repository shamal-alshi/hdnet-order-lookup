import { Component, effect, OnInit, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { StatusChipComponent } from '../status-chip.component';
import { AuthStore } from '../../../core/auth.store';
import { OrdersStore } from '../orders.store';
import { CancelOrderDialogComponent } from '../cancel-order-dialog/cancel-order-dialog';
import { Order } from '../../../shared/models';
import { ToastService } from '../../../core/toast.service';


@Component({
  selector: 'app-orders-page',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatPaginatorModule,
    MatTableModule,
    MatToolbarModule,
    StatusChipComponent,
  ],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss',
})
/** Displays the signed-in user's current page of pharmacy delivery orders. */
export class OrdersPage implements OnInit {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  protected readonly store = inject(OrdersStore);
  protected readonly user = this.auth.user;

  protected readonly displayedColumns = [
    'orderNumber',
    'orderDate',
    'status',
    'rxCount',
    'shipToState',
    'actions',
  ];

  constructor() {
    effect(() => {
      const error = this.store.error();

      if (error) {
        this.toast.error(error);
      }
    });
  }

  ngOnInit(): void {
    this.store.load();
  }

  protected changePage(event: PageEvent): void {
    this.store.load(event.pageIndex, event.pageSize);
  }

  protected signOut(): void {
    this.auth.clearSession();
    void this.router.navigateByUrl('/login');
  }

  protected canCancel(order: Order): boolean {
    return (
      this.auth.hasRole('HDNet Cancel') &&
      (order.status === 'RECEIVED' || order.status === 'PROCESSING')
    );
  }

  protected openCancelDialog(order: Order): void {
    this.dialog
      .open(CancelOrderDialogComponent, { data: order, width: '30rem' })
      .afterClosed()
      .subscribe((updatedOrder: Order | undefined) => {
        if (updatedOrder) {
          this.store.replaceOrder(updatedOrder);
          this.toast.success(`Order ${updatedOrder.orderNumber} was cancelled.`);
        }
      });
  }
}

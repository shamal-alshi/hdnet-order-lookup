import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { StatusChipComponent } from '../status-chip.component';
import { AuthStore } from '../../../core/auth.store';
import { OrdersStore } from '../orders.store';


@Component({
  selector: 'app-orders-page',
  imports: [
    MatButtonModule,
    MatPaginatorModule,
    MatTableModule,
    MatToolbarModule,
    StatusChipComponent,
  ],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly store = inject(OrdersStore);
  protected readonly user = this.auth.user;

  protected readonly displayedColumns = [
    'orderNumber',
    'orderDate',
    'status',
    'rxCount',
    'shipToState',
  ];

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
}
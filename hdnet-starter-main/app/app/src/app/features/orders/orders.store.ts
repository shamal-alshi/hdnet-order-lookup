import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, Subject, switchMap, tap } from 'rxjs';
import { Order } from '../../shared/models';
import { OrdersApi } from './orders.api';

interface PageRequest {
  page: number;
  size: number;
}

interface OrdersState {
  items: Order[];
  totalItems: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  items: [],
  totalItems: 0,
  page: 0,
  pageSize: 25,
  isLoading: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly api = inject(OrdersApi);
  private readonly pageRequests = new Subject<PageRequest>();
  private readonly state = signal<OrdersState>(initialState);

  readonly items = computed(() => this.state().items);
  readonly totalItems = computed(() => this.state().totalItems);
  readonly page = computed(() => this.state().page);
  readonly pageSize = computed(() => this.state().pageSize);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  constructor() {
    this.pageRequests
      .pipe(
        tap((request) => {
          this.state.update((state) => ({
            ...state,
            page: request.page,
            pageSize: request.size,
            isLoading: true,
            error: null,
          }));
        }),
        switchMap((request) =>
          this.api.getOrders(request.page, request.size).pipe(
            map((response) => ({ request, response, error: null })),
            catchError(() =>
              of({
                request,
                response: null,
                error: 'Orders could not be loaded.',
              }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ request, response, error }) => {
        if (error || !response) {
          this.state.update((state) => ({
            ...state,
            isLoading: false,
            error: 'Orders could not be loaded.',
          }));
          return;
        }

        this.state.set({
          items: response.items,
          totalItems: response.totalItems,
          page: request.page,
          pageSize: request.size,
          isLoading: false,
          error: null,
        });
      });
  }

  load(page = this.page(), size = this.pageSize()): void {
    this.pageRequests.next({ page, size });
  }
}
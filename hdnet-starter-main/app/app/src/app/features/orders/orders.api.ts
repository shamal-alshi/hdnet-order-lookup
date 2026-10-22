import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OrdersResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly http = inject(HttpClient);

  getOrders(page: number, size: number) {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<OrdersResponse>(
      `${environment.apiBaseUrl}/orders`,
      { params },
    );
  }
}
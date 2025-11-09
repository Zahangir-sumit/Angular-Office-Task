// src/app/services/purchase-order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PurchaseOrder, Supplier, Warehouse, Product, PurchaseOrderFilter } from '../models/purchase-order.model';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  getPurchaseOrders(filter: PurchaseOrderFilter): Observable<{ data: PurchaseOrder[], total: number }> {
    let params = new HttpParams();

    // global search
    if (filter.search?.trim()) {
      params = params.set('q', filter.search.trim());
    }

    // status filter
    if (filter.status && filter.status !== 'All') {
      params = params.set('status', filter.status);
    }

    // date filters (convert Date -> YYYY-MM-DD if needed)
    const toDateParam = (v: any) => {
      if (!v) return null;
      if (v instanceof Date) return v.toISOString().split('T')[0];
      if (typeof v === 'string' && v.includes('T')) return new Date(v).toISOString().split('T')[0];
      return v.toString();
    };

    const start = toDateParam(filter.startDate);
    const end = toDateParam(filter.endDate);
    if (start) params = params.set('orderDate_gte', start);
    if (end) params = params.set('orderDate_lte', end);

    // Server-side pagination using json-server _page and _limit
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, filter.pageSize || 10);
    params = params.set('_page', page.toString()).set('_limit', limit.toString());

    // Use observe: 'response' to read X-Total-Count header
    return this.http.get<PurchaseOrder[]>(`${this.apiUrl}/purchaseOrders`, { params, observe: 'response' })
      .pipe(
        map((resp: HttpResponse<PurchaseOrder[]>) => {
          const totalHeader = resp.headers.get('X-Total-Count');
          const total = totalHeader ? Number(totalHeader) : (resp.body ? resp.body.length : 0);
          return {
            data: resp.body || [],
            total
          };
        })
      );
  }

  getPurchaseOrder(id: number) {
    return this.http.get<PurchaseOrder>(`${this.apiUrl}/purchaseOrders/${id}`);
  }

  createPurchaseOrder(po: PurchaseOrder) {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/purchaseOrders`, po);
  }

  updatePurchaseOrder(id: number, po: PurchaseOrder) {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/purchaseOrders/${id}`, po);
  }

  deletePurchaseOrder(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/purchaseOrders/${id}`);
  }

  getSuppliers() {
    return this.http.get<Supplier[]>(`${this.apiUrl}/suppliers`);
  }

  getWarehouses() {
    return this.http.get<Warehouse[]>(`${this.apiUrl}/warehouses`);
  }

  getProducts() {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  getVatRates() {
    return this.http.get<number[]>(`${this.apiUrl}/vatRates`);
  }
}

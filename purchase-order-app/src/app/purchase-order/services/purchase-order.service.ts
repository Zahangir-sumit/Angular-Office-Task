import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PurchaseOrder, Supplier, Warehouse, Product, PurchaseOrderFilter } from '../models/purchase-order.model';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  getPurchaseOrders(filter: PurchaseOrderFilter): Observable<{ data: PurchaseOrder[], total: number }> {
    let params = new HttpParams()
      .set('_page', filter.page.toString())
      .set('_limit', filter.pageSize.toString());

    if (filter.search) {
      params = params.set('q', filter.search);
    }
    if (filter.status && filter.status !== 'All') {
      params = params.set('status', filter.status);
    }

    return this.http.get<PurchaseOrder[]>(`${this.apiUrl}/purchaseOrders`, { 
      params, 
      observe: 'response' 
    }).pipe(
      map(response => ({
        data: response.body || [],
        total: parseInt(response.headers.get('X-Total-Count') || '0', 10)
      }))
    );
  }

  getPurchaseOrder(id: number): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`${this.apiUrl}/purchaseOrders/${id}`);
  }

  createPurchaseOrder(po: PurchaseOrder): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/purchaseOrders`, po);
  }

  updatePurchaseOrder(id: number, po: PurchaseOrder): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/purchaseOrders/${id}`, po);
  }

  deletePurchaseOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/purchaseOrders/${id}`);
  }

  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.apiUrl}/suppliers`);
  }

  getWarehouses(): Observable<Warehouse[]> {
    return this.http.get<Warehouse[]>(`${this.apiUrl}/warehouses`);
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  getVatRates(): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/vatRates`);
  }
}
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
    // Build query parameters for json-server
    let params = new HttpParams();

    // Add search parameter (json-server uses 'q' for global search)
    if (filter.search && filter.search.trim() !== '') {
      params = params.set('q', filter.search.trim());
    }

    // Add status filter
    if (filter.status && filter.status !== 'All') {
      params = params.set('status', filter.status);
    }

    // Add date range filters
    if (filter.startDate) {
      params = params.set('orderDate_gte', filter.startDate);
    }
    if (filter.endDate) {
      params = params.set('orderDate_lte', filter.endDate);
    }

    console.log('API Call with params:', params.toString());

    // Get all data with filters first to get total count
    return this.http.get<PurchaseOrder[]>(`${this.apiUrl}/purchaseOrders`, { params }).pipe(
      map(allData => {
        // Apply manual pagination on the client side
        const startIndex = (filter.page - 1) * filter.pageSize;
        const endIndex = startIndex + filter.pageSize;
        const paginatedData = allData.slice(startIndex, endIndex);

        return {
          data: paginatedData,
          total: allData.length
        };
      })
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

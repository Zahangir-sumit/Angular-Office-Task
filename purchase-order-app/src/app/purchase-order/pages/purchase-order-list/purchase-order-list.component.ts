// src/app/purchase-order-list/purchase-order-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, catchError } from 'rxjs/operators';
import { PurchaseOrder, PurchaseOrderFilter, Supplier, Warehouse } from '../../models/purchase-order.model';
import { PurchaseOrderService } from '../../services/purchase-order.service';

@Component({
  standalone: false,
  selector: 'app-purchase-order-list',
  templateUrl: './purchase-order-list.component.html',
  styleUrls: ['./purchase-order-list.component.css']
})
export class PurchaseOrderListComponent implements OnInit, OnDestroy {
  purchaseOrders: PurchaseOrder[] = [];
  suppliers: Supplier[] = [];
  warehouses: Warehouse[] = [];
  filterForm: FormGroup;
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();
  private loadTrigger$ = new Subject<PurchaseOrderFilter>();

  statusOptions = ['All', 'Draft', 'Approved', 'Received'];

  constructor(
    private purchaseOrderService: PurchaseOrderService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: ['All'],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    // Master data
    this.loadMasterData();

    // Centralized loader: debounce rapid triggers and cancel previous in-flight requests
    this.loadTrigger$.pipe(
      debounceTime(150),
      // if multiple triggers come, cancel previous HTTP via switchMap
      switchMap((filter: PurchaseOrderFilter) => {
        this.loading = true;
        this.error = null;
        // Call service
        return this.purchaseOrderService.getPurchaseOrders(filter).pipe(
          catchError(err => {
            console.error('API error', err);
            // Return a fallback so stream doesn't break
            return of({ data: [], total: 0 });
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((resp) => {
      this.purchaseOrders = resp.data;
      this.totalItems = resp.total;
      this.loading = false;
    });

    // Hook form changes to trigger load (debounced)
    this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(), // compares references; OK for our use-case
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.triggerLoad();
    });

    // Initial load
    this.triggerLoad();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Build filter object from form + paging and push into loadTrigger$
  private triggerLoad(): void {
    const fv = this.filterForm.value;
    const filter: PurchaseOrderFilter = {
      search: fv.search,
      status: fv.status,
      startDate: fv.startDate,
      endDate: fv.endDate,
      page: this.currentPage,
      pageSize: this.pageSize
    };
    console.log('Trigger load with filter:', filter);
    this.loadTrigger$.next(filter);
  }

  loadPurchaseOrders(): void {
    // kept for manual button retry and backwards compatibility
    this.triggerLoad();
  }

  loadMasterData(): void {
    this.purchaseOrderService.getSuppliers().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.suppliers = data,
      error: (err) => console.error('Error loading suppliers:', err)
    });

    this.purchaseOrderService.getWarehouses().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.warehouses = data,
      error: (err) => console.error('Error loading warehouses:', err)
    });
  }

  onPageChange(page: number): void {
    if (page === this.currentPage) return;
    this.currentPage = page;
    this.triggerLoad();
  }

  createPurchaseOrder(): void {
    this.router.navigate(['/purchase-orders/create']);
  }

  editPurchaseOrder(id: number): void {
    this.router.navigate(['/purchase-orders/edit', id]);
  }

  viewPurchaseOrder(id: number): void {
    this.router.navigate(['/purchase-orders/view', id]);
  }

  deletePurchaseOrder(id: number): void {
    if (!confirm('Are you sure you want to delete this purchase order? This action cannot be undone.')) return;

    this.loading = true;
    this.purchaseOrderService.deletePurchaseOrder(id).subscribe({
      next: () => {
        // after delete, re-trigger load (stay on same page if possible)
        this.triggerLoad();
      },
      error: (error) => {
        console.error('Error deleting purchase order:', error);
        this.loading = false;
        alert('Error deleting purchase order. Please try again.');
      }
    });
  }

  clearFilters(): void {
    this.filterForm.setValue({
      search: '',
      status: 'All',
      startDate: '',
      endDate: ''
    });
    // triggerLoad will be called via valueChanges subscription
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'success';
      case 'Draft': return 'warning';
      case 'Received': return 'info';
      default: return 'secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Approved': return 'fas fa-check-circle';
      case 'Draft': return 'fas fa-edit';
      case 'Received': return 'fas fa-box-open';
      default: return 'fas fa-question-circle';
    }
  }

  getSupplierName(supplierId: number): string {
    const supplier = this.suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : `Supplier ${supplierId}`;
  }

  getWarehouseName(warehouseId: number): string {
    const warehouse = this.warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : `Warehouse ${warehouseId}`;
  }

  getDisplayRange(): { start: number; end: number } {
    if (this.totalItems === 0) return { start: 0, end: 0 };
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalItems);
    return { start, end };
  }

  getTotalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }
}

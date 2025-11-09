import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
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
    this.loadPurchaseOrders();
    this.loadMasterData();

    // Use debounce to prevent too many API calls
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500), // Wait 500ms after user stops typing
        distinctUntilChanged(), // Only emit when value changes
        takeUntil(this.destroy$) // Clean up on component destroy
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadPurchaseOrders();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPurchaseOrders(): void {
    this.loading = true;
    this.error = null;

    const filter: PurchaseOrderFilter = {
      ...this.filterForm.value,
      page: this.currentPage,
      pageSize: this.pageSize
    };

    console.log('Loading purchase orders with filter:', filter);

    this.purchaseOrderService.getPurchaseOrders(filter).subscribe({
      next: (response) => {
        console.log('Received response:', response);
        this.purchaseOrders = response.data;
        this.totalItems = response.total;
        this.loading = false;
        this.error = null;
      },
      error: (error) => {
        console.error('Error loading purchase orders:', error);
        this.loading = false;
        this.error = 'Failed to load purchase orders. Please try again.';
        this.purchaseOrders = [];
        this.totalItems = 0;
      }
    });
  }

  loadMasterData(): void {
    this.purchaseOrderService.getSuppliers().subscribe({
      next: (data) => this.suppliers = data,
      error: (error) => console.error('Error loading suppliers:', error)
    });

    this.purchaseOrderService.getWarehouses().subscribe({
      next: (data) => this.warehouses = data,
      error: (error) => console.error('Error loading warehouses:', error)
    });
  }

  onPageChange(page: number): void {
    console.log('Page changed to:', page);
    this.currentPage = page;
    this.loadPurchaseOrders();
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
    if (confirm('Are you sure you want to delete this purchase order? This action cannot be undone.')) {
      this.loading = true;
      this.purchaseOrderService.deletePurchaseOrder(id).subscribe({
        next: () => {
          this.loadPurchaseOrders();
        },
        error: (error) => {
          console.error('Error deleting purchase order:', error);
          this.loading = false;
          alert('Error deleting purchase order. Please try again.');
        }
      });
    }
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: 'All',
      startDate: '',
      endDate: ''
    });
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

  // Helper to calculate display range for pagination
  getDisplayRange(): { start: number, end: number } {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalItems);
    return { start, end };
  }

  // Helper method to calculate total pages
  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }
}

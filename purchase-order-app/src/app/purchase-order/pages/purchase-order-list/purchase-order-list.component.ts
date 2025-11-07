import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { PurchaseOrder, PurchaseOrderFilter, Supplier, Warehouse } from '../../models/purchase-order.model';
import { PurchaseOrderService } from '../../services/purchase-order.service';

@Component({
  standalone: false,
  selector: 'app-purchase-order-list',
  templateUrl: './purchase-order-list.component.html',
  styleUrls: ['./purchase-order-list.component.css']
})
export class PurchaseOrderListComponent implements OnInit {
  purchaseOrders: PurchaseOrder[] = [];
  suppliers: Supplier[] = [];
  warehouses: Warehouse[] = [];
  filterForm: FormGroup;
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  loading = false;

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
    
    // Subscribe to form changes for real-time filtering
    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.loadPurchaseOrders();
    });
  }

  loadPurchaseOrders(): void {
    this.loading = true;
    const filter: PurchaseOrderFilter = {
      ...this.filterForm.value,
      page: this.currentPage,
      pageSize: this.pageSize
    };

    this.purchaseOrderService.getPurchaseOrders(filter).subscribe({
      next: (response) => {
        this.purchaseOrders = response.data;
        this.totalItems = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading purchase orders:', error);
        this.loading = false;
        alert('Error loading purchase orders. Please try again.');
      }
    });
  }

  loadMasterData(): void {
    this.purchaseOrderService.getSuppliers().subscribe(data => this.suppliers = data);
    this.purchaseOrderService.getWarehouses().subscribe(data => this.warehouses = data);
  }

  // Pagination methods
  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  getPages(): number[] {
    const totalPages = this.getTotalPages();
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate start and end pages
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = startPage + maxVisiblePages - 1;
      
      // Adjust if end page exceeds total pages
      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages() && page !== this.currentPage) {
      this.currentPage = page;
      this.loadPurchaseOrders();
    }
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToLastPage(): void {
    this.goToPage(this.getTotalPages());
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
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
      this.purchaseOrderService.deletePurchaseOrder(id).subscribe({
        next: () => {
          this.loadPurchaseOrders();
          alert('Purchase order deleted successfully.');
        },
        error: (error) => {
          console.error('Error deleting purchase order:', error);
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
    console.log(this.suppliers);
    console.log(supplierId);
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
}
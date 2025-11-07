import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PurchaseOrder, Supplier, Warehouse, Product, PurchaseOrderItem } from '../../models/purchase-order.model';
import { PurchaseOrderService } from '../../services/purchase-order.service';

@Component({
  standalone: false,
  selector: 'app-purchase-order-form',
  templateUrl: './purchase-order-form.component.html',
  styleUrls: ['./purchase-order-form.component.css']
})
export class PurchaseOrderFormComponent implements OnInit {
  purchaseOrderForm: FormGroup;
  isEditMode = false;
  purchaseOrderId: number | null = null;
  suppliers: Supplier[] = [];
  warehouses: Warehouse[] = [];
  products: Product[] = [];
  vatRates: number[] = [5, 10, 15, 20];
  loading = false;
  isSubmitting = false;

  // Summary calculations
  subtotal = 0;
  vatAmount = 0;
  grandTotal = 0;

  constructor(
    private fb: FormBuilder,
    private purchaseOrderService: PurchaseOrderService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.purchaseOrderForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadMasterData();
    this.checkEditMode();
    
    // Subscribe to form changes for real-time calculations
    this.purchaseOrderForm.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      poNumber: [''],
      supplierId: ['', Validators.required],
      warehouseId: ['', Validators.required],
      shippingAddress: ['', Validators.required],
      vatRate: [15, Validators.required],
      orderDate: [new Date().toISOString().split('T')[0], Validators.required],
      memo: [''],
      items: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });
  }

  get items(): FormArray {
    return this.purchaseOrderForm.get('items') as FormArray;

  }

  createItemFormGroup(item?: PurchaseOrderItem): FormGroup {
    return this.fb.group({
      productId: [item?.productId || '', Validators.required],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(1)]],
      unitPrice: [item?.unitPrice || '', [Validators.required, Validators.min(0.01)]],
      lineTotal: [{ value: item?.lineTotal || 0, disabled: true }]
    });
  }

  addItem(): void {
    this.items.push(this.createItemFormGroup());
    this.calculateTotals();
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.calculateTotals();
  }

  loadMasterData(): void {
    this.loading = true;
    
    this.purchaseOrderService.getSuppliers().subscribe({
      next: (data) => {
        this.suppliers = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.loading = false;
      }
    });

    this.purchaseOrderService.getWarehouses().subscribe(data => this.warehouses = data);
    this.purchaseOrderService.getProducts().subscribe(data => this.products = data);
  }

  checkEditMode(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.purchaseOrderId = +params['id'];
        this.loadPurchaseOrder(this.purchaseOrderId);
      }
    });
  }

  loadPurchaseOrder(id: number): void {
    this.loading = true;
    this.purchaseOrderService.getPurchaseOrder(id).subscribe({
      next: (po) => {
        this.purchaseOrderForm.patchValue({
          poNumber: po.poNumber,
          supplierId: po.supplierId,
          warehouseId: po.warehouseId,
          shippingAddress: po.shippingAddress,
          vatRate: po.vatRate,
          orderDate: po.orderDate,
          memo: po.memo
        });

        // Clear existing items and add loaded items
        this.items.clear();
        po.items.forEach(item => {
          this.items.push(this.createItemFormGroup(item));
        });

        this.calculateTotals();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading purchase order:', error);
        this.loading = false;
      }
    });
  }

  calculateLineTotal(index: number): number {
    const item = this.items.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const unitPrice = item.get('unitPrice')?.value || 0;
    const lineTotal = quantity * unitPrice;
    
    item.patchValue({ lineTotal }, { emitEvent: false });
    return lineTotal;
  }

  calculateTotals(): void {
    // Calculate all line totals
    let newSubtotal = 0;
    this.items.controls.forEach((item, index) => {
      newSubtotal += this.calculateLineTotal(index);
    });

    const vatRate = this.purchaseOrderForm.get('vatRate')?.value || 0;
    const newVatAmount = (newSubtotal * vatRate) / 100;
    const newGrandTotal = newSubtotal + newVatAmount;

    // Update component properties
    this.subtotal = newSubtotal;
    this.vatAmount = newVatAmount;
    this.grandTotal = newGrandTotal;
  }

  getProductName(productId: number): string {
    const product = this.products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  }

  getSupplierName(supplierId: number): string {
    const supplier = this.suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unknown Supplier';
  }

  getWarehouseName(warehouseId: number): string {
    const warehouse = this.warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Unknown Warehouse';
  }

  onSubmit(): void {
    if (this.purchaseOrderForm.valid && this.items.length > 0) {
      this.isSubmitting = true;

      const formValue = this.purchaseOrderForm.getRawValue();
      
      const purchaseOrder: PurchaseOrder = {
        poNumber: this.isEditMode ? formValue.poNumber : this.generatePONumber(),
        supplierId: parseInt(formValue.supplierId),
        warehouseId: parseInt(formValue.warehouseId),
        shippingAddress: formValue.shippingAddress,
        vatRate: formValue.vatRate,
        orderDate: formValue.orderDate,
        status: 'Draft',
        memo: formValue.memo,
        items: formValue.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.quantity * item.unitPrice
        })),
        subtotal: this.subtotal,
        vatAmount: this.vatAmount,
        grandTotal: this.grandTotal
      };

      const observable = this.isEditMode && this.purchaseOrderId
        ? this.purchaseOrderService.updatePurchaseOrder(this.purchaseOrderId, purchaseOrder)
        : this.purchaseOrderService.createPurchaseOrder(purchaseOrder);

      observable.subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/purchase-orders']);
        },
        error: (error) => {
          console.error('Error saving purchase order:', error);
          this.isSubmitting = false;
          alert('Error saving purchase order. Please try again.');
        }
      });
    } else {
      this.markFormGroupTouched(this.purchaseOrderForm);
      if (this.items.length === 0) {
        alert('Please add at least one item to the purchase order.');
      }
    }
  }

  generatePONumber(): string {
    const timestamp = new Date().getTime();
    return `PO-${timestamp}`;
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      }
    });
  }

  onCancel(): void {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      this.router.navigate(['/purchase-orders']);
    }
  }

  // Helper method to check if form field is invalid
  isFieldInvalid(fieldName: string): boolean {
    const field = this.purchaseOrderForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Helper method to check if item field is invalid
  isItemFieldInvalid(index: number, fieldName: string): boolean {
    const item = this.items.at(index);
    const field = item.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
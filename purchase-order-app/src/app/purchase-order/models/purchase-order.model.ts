export interface PurchaseOrder {
  id?: number;
  poNumber: string;
  supplierId: number;
  warehouseId: number;
  shippingAddress: string;
  vatRate: number;
  orderDate: string;
  status: 'Draft' | 'Approved' | 'Received';
  memo?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
}

export interface PurchaseOrderItem {
  id?: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface Warehouse {
  id: number;
  name: string;
  address: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
}

export interface PurchaseOrderFilter {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}
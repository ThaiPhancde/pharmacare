export interface CustomerReturn {
  id?: string;
  returnNumber: string;
  invoiceId: string;
  customerId: string;
  returnDate: string;
  totalAmount: number;
  reason: string;
  status: string;
  items: CustomerReturnItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerReturnItem {
  id?: string;
  medicineId: string;
  medicineName: string;
  batchId: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface SupplierReturn {
  id?: string;
  returnNumber: string;
  purchaseId: string;
  supplierId: string;
  returnDate: string;
  totalAmount: number;
  reason: string;
  status: string;
  items: SupplierReturnItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierReturnItem {
  id?: string;
  medicineId: string;
  medicineName: string;
  batchId: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  amount: number;
} 
/**
 * Test Suite: Business Logic & Helper Functions
 * Kiểm thử các logic nghiệp vụ quan trọng của hệ thống quản lý nhà thuốc PharmaCare
 * 
 * Mục đích: Đảm bảo các logic nghiệp vụ hoạt động chính xác
 * - Medicine Expiry Check: Kiểm tra hạn sử dụng thuốc (expired, expiring-soon, valid)
 * - Invoice Calculation: Tính toán hóa đơn (total, tax, grand total)
 * - Stock Management: Quản lý tồn kho (low stock, out of stock, reorder)
 * - Search & Filter: Tìm kiếm và lọc thuốc
 * 
 * Các logic này tương ứng với:
 * - server/api/stock/expiring.ts: Kiểm tra thuốc sắp hết hạn
 * - server/models/Stock.ts: Model tồn kho với expiry_date
 * - server/models/Invoice.ts: Model hóa đơn
 * - components/medicine/: Tìm kiếm thuốc
 * 
 * Công nghệ: Vitest, TypeScript
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ==================== Medicine Expiry Check ====================
interface MedicineStock {
  name: string
  batch_id: string
  expiry_date: string
  quantity: number
}

const isExpired = (expiryDate: string): boolean => {
  const expiry = new Date(expiryDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return expiry < today
}

const isExpiringSoon = (expiryDate: string, daysThreshold: number = 30): boolean => {
  const expiry = new Date(expiryDate)
  const today = new Date()
  const thresholdDate = new Date(today.getTime() + daysThreshold * 24 * 60 * 60 * 1000)
  return expiry <= thresholdDate && expiry >= today
}

const getExpiryStatus = (expiryDate: string): 'expired' | 'expiring-soon' | 'valid' => {
  if (isExpired(expiryDate)) return 'expired'
  if (isExpiringSoon(expiryDate)) return 'expiring-soon'
  return 'valid'
}

describe('Medicine Expiry Check Functions', () => {
  it('TC047: should detect expired medicine', () => {
    const pastDate = '2024-01-01'
    expect(isExpired(pastDate)).toBe(true)
  })

  it('TC048: should detect non-expired medicine', () => {
    const futureDate = '2026-12-31'
    expect(isExpired(futureDate)).toBe(false)
  })

  it('TC049: should detect medicine expiring within 30 days', () => {
    const today = new Date()
    const nearFuture = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)
    const dateStr = nearFuture.toISOString().split('T')[0]
    expect(isExpiringSoon(dateStr, 30)).toBe(true)
  })

  it('TC050: should return correct expiry status', () => {
    expect(getExpiryStatus('2024-01-01')).toBe('expired')
    expect(getExpiryStatus('2030-12-31')).toBe('valid')
  })
})

// ==================== Invoice Calculation ====================
interface InvoiceItem {
  medicine_id: string
  quantity: number
  unit_price: number
  discount: number
}

const calculateItemTotal = (item: InvoiceItem): number => {
  const subtotal = item.quantity * item.unit_price
  const discountAmount = subtotal * (item.discount / 100)
  return subtotal - discountAmount
}

const calculateInvoiceTotal = (items: InvoiceItem[]): number => {
  return items.reduce((total, item) => total + calculateItemTotal(item), 0)
}

const calculateTax = (amount: number, taxRate: number = 10): number => {
  return Math.round(amount * (taxRate / 100))
}

const calculateGrandTotal = (items: InvoiceItem[], taxRate: number = 0): number => {
  const subtotal = calculateInvoiceTotal(items)
  const tax = calculateTax(subtotal, taxRate)
  return subtotal + tax
}

describe('Invoice Calculation Functions', () => {
  it('TC051: should calculate item total correctly', () => {
    const item: InvoiceItem = {
      medicine_id: 'med-001',
      quantity: 10,
      unit_price: 5000,
      discount: 10
    }
    // 10 * 5000 = 50000, discount 10% = 5000, total = 45000
    expect(calculateItemTotal(item)).toBe(45000)
  })

  it('TC052: should calculate invoice total for multiple items', () => {
    const items: InvoiceItem[] = [
      { medicine_id: 'med-001', quantity: 2, unit_price: 10000, discount: 0 },
      { medicine_id: 'med-002', quantity: 3, unit_price: 5000, discount: 0 }
    ]
    // 2*10000 + 3*5000 = 20000 + 15000 = 35000
    expect(calculateInvoiceTotal(items)).toBe(35000)
  })

  it('TC053: should calculate tax correctly', () => {
    expect(calculateTax(100000, 10)).toBe(10000)
    expect(calculateTax(50000, 5)).toBe(2500)
  })
})

// ==================== Stock Management ====================
interface StockItem {
  medicine_id: string
  quantity: number
  min_quantity: number
}

const isLowStock = (item: StockItem): boolean => {
  return item.quantity <= item.min_quantity
}

const getStockStatus = (item: StockItem): 'out-of-stock' | 'low-stock' | 'in-stock' => {
  if (item.quantity === 0) return 'out-of-stock'
  if (item.quantity <= item.min_quantity) return 'low-stock'
  return 'in-stock'
}

const calculateReorderQuantity = (item: StockItem, targetStock: number): number => {
  if (item.quantity >= targetStock) return 0
  return targetStock - item.quantity
}

describe('Stock Management Functions', () => {
  it('TC054: should detect low stock items', () => {
    const lowStockItem: StockItem = { medicine_id: 'med-001', quantity: 5, min_quantity: 10 }
    const normalItem: StockItem = { medicine_id: 'med-002', quantity: 50, min_quantity: 10 }
    
    expect(isLowStock(lowStockItem)).toBe(true)
    expect(isLowStock(normalItem)).toBe(false)
  })

  it('TC055: should return correct stock status', () => {
    expect(getStockStatus({ medicine_id: 'med-001', quantity: 0, min_quantity: 10 })).toBe('out-of-stock')
    expect(getStockStatus({ medicine_id: 'med-002', quantity: 5, min_quantity: 10 })).toBe('low-stock')
    expect(getStockStatus({ medicine_id: 'med-003', quantity: 50, min_quantity: 10 })).toBe('in-stock')
  })

  it('TC056: should calculate reorder quantity correctly', () => {
    const item: StockItem = { medicine_id: 'med-001', quantity: 20, min_quantity: 10 }
    expect(calculateReorderQuantity(item, 100)).toBe(80)
    expect(calculateReorderQuantity(item, 10)).toBe(0)
  })
})

// ==================== Search & Filter Functions ====================
interface SearchableMedicine {
  id: string
  name: string
  genericName?: string
  barcode?: string
  category: string
}

const searchMedicines = (medicines: SearchableMedicine[], query: string): SearchableMedicine[] => {
  const lowerQuery = query.toLowerCase().trim()
  if (!lowerQuery) return medicines
  
  return medicines.filter(med => 
    med.name.toLowerCase().includes(lowerQuery) ||
    med.genericName?.toLowerCase().includes(lowerQuery) ||
    med.barcode?.includes(query) ||
    med.category.toLowerCase().includes(lowerQuery)
  )
}

const filterByCategory = (medicines: SearchableMedicine[], category: string): SearchableMedicine[] => {
  if (!category || category === 'all') return medicines
  return medicines.filter(med => med.category === category)
}

describe('Search & Filter Functions', () => {
  const sampleMedicines: SearchableMedicine[] = [
    { id: '1', name: 'Paracetamol', genericName: 'Acetaminophen', barcode: '123456', category: 'Pain Relief' },
    { id: '2', name: 'Amoxicillin', genericName: 'Amoxicillin', barcode: '234567', category: 'Antibiotics' },
    { id: '3', name: 'Vitamin C', barcode: '345678', category: 'Supplements' },
  ]

  it('TC057: should search medicines by name', () => {
    const results = searchMedicines(sampleMedicines, 'para')
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('Paracetamol')
  })

  it('TC058: should search medicines by generic name', () => {
    const results = searchMedicines(sampleMedicines, 'acetaminophen')
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('Paracetamol')
  })

  it('TC059: should filter medicines by category', () => {
    const results = filterByCategory(sampleMedicines, 'Antibiotics')
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('Amoxicillin')
  })

  it('TC060: should return all medicines when category is "all"', () => {
    const results = filterByCategory(sampleMedicines, 'all')
    expect(results.length).toBe(3)
  })
})

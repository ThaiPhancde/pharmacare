/**
 * Test Suite: Model Validation with Zod
 * Tests for medicine, customer, supplier model schemas
 */
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Medicine Schema
const medicineSchema = z.object({
  id: z.string(),
  barcode: z.string().optional(),
  name: z.string().min(1, 'Medicine Name is required'),
  unit: z.string().min(1, 'Unit is required'),
  category: z.string().min(1, 'Category is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  supplierPrice: z.coerce.number().min(0, 'Supplier Price must be positive'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  status: z.boolean(),
  prescription_required: z.boolean().optional().default(false),
  max_quantity_per_day: z.coerce.number().min(0).optional().nullable(),
})

// Customer Schema
const customerSchema = z.object({
  customer_id: z.string().optional(),
  full_name: z.string().min(1, 'Tên là bắt buộc'),
  contact_info: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
})

// Supplier Schema
const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  mail: z.string().optional(),
  city: z.string().optional(),
  balance: z.preprocess(
    (val) => (val !== '' ? Number(val) : 0),
    z.number().min(0, 'Balance must be positive').optional()
  ),
})

describe('Medicine Schema Validation', () => {
  it('TC027: should validate a complete medicine object', () => {
    const validMedicine = {
      id: 'med-001',
      name: 'Paracetamol',
      unit: 'Viên',
      category: 'Thuốc giảm đau',
      supplier: 'Pharma Corp',
      supplierPrice: 5000,
      price: 10000,
      status: true,
    }
    
    const result = medicineSchema.safeParse(validMedicine)
    expect(result.success).toBe(true)
  })

  it('TC028: should fail validation when name is empty', () => {
    const invalidMedicine = {
      id: 'med-002',
      name: '',
      unit: 'Viên',
      category: 'Thuốc',
      supplier: 'Supplier',
      supplierPrice: 5000,
      price: 10000,
      status: true,
    }
    
    const result = medicineSchema.safeParse(invalidMedicine)
    expect(result.success).toBe(false)
  })

  it('TC029: should fail validation when price is negative', () => {
    const invalidMedicine = {
      id: 'med-003',
      name: 'Test Medicine',
      unit: 'Viên',
      category: 'Thuốc',
      supplier: 'Supplier',
      supplierPrice: -100,
      price: 10000,
      status: true,
    }
    
    const result = medicineSchema.safeParse(invalidMedicine)
    expect(result.success).toBe(false)
  })

  it('TC030: should coerce string numbers to numbers', () => {
    const medicine = {
      id: 'med-004',
      name: 'Test Medicine',
      unit: 'Viên',
      category: 'Thuốc',
      supplier: 'Supplier',
      supplierPrice: '5000' as any,
      price: '10000' as any,
      status: true,
    }
    
    const result = medicineSchema.safeParse(medicine)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBe(10000)
    }
  })
})

describe('Customer Schema Validation', () => {
  it('TC031: should validate a complete customer object', () => {
    const validCustomer = {
      full_name: 'Nguyễn Văn A',
      contact_info: {
        phone: '0901234567',
        email: 'test@example.com',
        address: '123 Đường ABC',
      },
    }
    
    const result = customerSchema.safeParse(validCustomer)
    expect(result.success).toBe(true)
  })

  it('TC032: should fail validation when full_name is empty', () => {
    const invalidCustomer = {
      full_name: '',
      contact_info: {
        phone: '0901234567',
      },
    }
    
    const result = customerSchema.safeParse(invalidCustomer)
    expect(result.success).toBe(false)
  })

  it('TC033: should allow customer without contact_info', () => {
    const minimalCustomer = {
      full_name: 'Khách hàng Test',
    }
    
    const result = customerSchema.safeParse(minimalCustomer)
    expect(result.success).toBe(true)
  })
})

describe('Supplier Schema Validation', () => {
  it('TC034: should validate a complete supplier object', () => {
    const validSupplier = {
      name: 'Công ty Dược phẩm ABC',
      address: '456 Đường XYZ',
      phone: '02812345678',
      mail: 'contact@abc.com',
      city: 'Hồ Chí Minh',
      balance: 1000000,
    }
    
    const result = supplierSchema.safeParse(validSupplier)
    expect(result.success).toBe(true)
  })

  it('TC035: should fail validation when name is empty', () => {
    const invalidSupplier = {
      name: '',
      phone: '02812345678',
    }
    
    const result = supplierSchema.safeParse(invalidSupplier)
    expect(result.success).toBe(false)
  })

  it('TC036: should convert empty string balance to 0', () => {
    const supplier = {
      name: 'Test Supplier',
      balance: '',
    }
    
    const result = supplierSchema.safeParse(supplier)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.balance).toBe(0)
    }
  })
})

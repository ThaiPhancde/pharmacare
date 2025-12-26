/**
 * Test Suite: Model Validation with Zod
 * Kiểm thử validation cho các model dữ liệu Medicine, Customer, Supplier
 * 
 * Mục đích: Đảm bảo các schema validation hoạt động đúng
 * - Medicine Schema: Kiểm tra validation thuốc (tên, đơn vị, giá, danh mục...)
 * - Customer Schema: Kiểm tra validation khách hàng (tên, thông tin liên hệ...)
 * - Supplier Schema: Kiểm tra validation nhà cung cấp (tên, địa chỉ, số dư...)
 * 
 * Công nghệ: Vitest, TypeScript, Zod Schema Validation
 */
import { describe, it, expect } from 'vitest'

// Import trực tiếp các schema từ project để test validation thực tế
import { data as medicineSchema, form as medicineFormSchema } from '@/models/medicine'
import { data as customerSchema, form as customerFormSchema } from '@/models/customer'
import { data as supplierSchema, form as supplierFormSchema } from '@/models/supplier'

describe('Medicine Schema Validation', () => {
  it('TC027: should validate a complete medicine object (data schema)', () => {
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

  it('TC028: should fail validation when name is empty (form schema)', () => {
    const invalidMedicine = {
      name: '',
      unit: 'Viên',
      category: 'Thuốc',
      supplier: 'Supplier',
      supplierPrice: 5000,
      price: 10000,
      status: true,
    }
    
    const result = medicineFormSchema.safeParse(invalidMedicine)
    expect(result.success).toBe(false)
  })

  it('TC029: should fail validation when price is negative (form schema)', () => {
    const invalidMedicine = {
      name: 'Test Medicine',
      unit: 'Viên',
      category: 'Thuốc',
      supplier: 'Supplier',
      supplierPrice: -100,
      price: 10000,
      status: true,
    }
    
    const result = medicineFormSchema.safeParse(invalidMedicine)
    expect(result.success).toBe(false)
  })

  it('TC030: should coerce string numbers to numbers (form schema)', () => {
    const medicine = {
      name: 'Test Medicine',
      unit: 'Viên',
      category: 'Thuốc',
      supplier: 'Supplier',
      supplierPrice: '5000' as any,
      price: '10000' as any,
      status: true,
    }
    
    const result = medicineFormSchema.safeParse(medicine)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBe(10000)
    }
  })
})

describe('Customer Schema Validation', () => {
  it('TC031: should validate a complete customer object (form schema)', () => {
    const validCustomer = {
      full_name: 'Nguyễn Văn A',
      contact_info: {
        phone: '0901234567',
        email: 'test@example.com',
        address: '123 Đường ABC',
      },
    }
    
    const result = customerFormSchema.safeParse(validCustomer)
    expect(result.success).toBe(true)
  })

  it('TC032: should fail validation when full_name is empty (form schema)', () => {
    const invalidCustomer = {
      full_name: '',
      contact_info: {
        phone: '0901234567',
      },
    }
    
    const result = customerFormSchema.safeParse(invalidCustomer)
    expect(result.success).toBe(false)
  })

  it('TC033: should allow customer without contact_info (form schema)', () => {
    const minimalCustomer = {
      full_name: 'Khách hàng Test',
    }
    
    const result = customerFormSchema.safeParse(minimalCustomer)
    expect(result.success).toBe(true)
  })
})

describe('Supplier Schema Validation', () => {
  it('TC034: should validate a complete supplier object (form schema)', () => {
    const validSupplier = {
      name: 'Công ty Dược phẩm ABC',
      address: '456 Đường XYZ',
      phone: '02812345678',
      mail: 'contact@abc.com',
      city: 'Hồ Chí Minh',
      balance: 1000000,
    }
    
    const result = supplierFormSchema.safeParse(validSupplier)
    expect(result.success).toBe(true)
  })

  it('TC035: should fail validation when name is empty (form schema)', () => {
    const invalidSupplier = {
      name: '',
      phone: '02812345678',
    }
    
    const result = supplierFormSchema.safeParse(invalidSupplier)
    expect(result.success).toBe(false)
  })

  it('TC036: should convert empty string balance to 0 (form schema)', () => {
    const supplier = {
      name: 'Test Supplier',
      balance: '',
    }
    
    const result = supplierFormSchema.safeParse(supplier)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.balance).toBe(0)
    }
  })
})

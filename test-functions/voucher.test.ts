/**
 * Test Suite: Voucher Management Functions
 * Kiểm thử hệ thống quản lý voucher/khuyến mãi của PharmaCare
 * 
 * Mục đích: Đảm bảo các chức năng voucher hoạt động chính xác
 * - createDefaultVoucherForm: Tạo form voucher với giá trị mặc định
 * - normalizeNumber: Chuẩn hóa số (xử lý null, undefined, NaN)
 * - serializeVoucherPayload: Serialize payload để gửi lên API
 * 
 * Các logic này tương ứng với:
 * - components/voucher/VoucherForm.vue: Form tạo/sửa voucher
 * - components/voucher/VoucherList.vue: Danh sách voucher
 * - server/api/voucher/: API quản lý voucher
 * 
 * Công nghệ: Vitest, TypeScript
 */
import { describe, it, expect } from 'vitest'

type VoucherDiscountType = 'percentage' | 'fixed'
type VoucherApplicableScope = 'all' | 'medicine' | 'service' | 'category'
type VoucherStatus = 'active' | 'inactive' | 'expired'

interface VoucherFormState {
  voucher_code: string
  name: string
  description: string
  discount_type: VoucherDiscountType
  discount_value: number | null
  min_purchase_amount: number | null
  max_discount_amount: number | null
  usage_limit: number | null
  usage_limit_per_customer: number | null
  max_users: number | null
  start_date: number
  end_date: number
  applicable_to: VoucherApplicableScope
  status: VoucherStatus
}

const createDefaultVoucherForm = (): VoucherFormState => {
  const now = Date.now()
  return {
    voucher_code: '',
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_purchase_amount: 0,
    max_discount_amount: null,
    usage_limit: null,
    usage_limit_per_customer: 1,
    max_users: null,
    start_date: now,
    end_date: now,
    applicable_to: 'all',
    status: 'active',
  }
}

const normalizeNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return undefined
  if (Number.isNaN(value)) return undefined
  return value
}

const serializeVoucherPayload = (form: VoucherFormState) => {
  const payload: Record<string, any> = {
    voucher_code: form.voucher_code?.trim(),
    name: form.name?.trim(),
    description: form.description?.trim() || undefined,
    discount_type: form.discount_type,
    discount_value: normalizeNumber(form.discount_value) ?? 0,
    min_purchase_amount: normalizeNumber(form.min_purchase_amount),
    usage_limit: normalizeNumber(form.usage_limit),
    usage_limit_per_customer: normalizeNumber(form.usage_limit_per_customer) ?? 1,
    max_users: normalizeNumber(form.max_users),
    start_date: new Date(form.start_date).toISOString(),
    end_date: new Date(form.end_date).toISOString(),
    applicable_to: form.applicable_to,
    status: form.status,
  }

  if (form.discount_type === 'percentage') {
    payload.max_discount_amount = normalizeNumber(form.max_discount_amount)
  }

  return payload
}

describe('createDefaultVoucherForm - Default Form Creation', () => {
  it('TC017: should create form with default values', () => {
    const form = createDefaultVoucherForm()
    expect(form.voucher_code).toBe('')
    expect(form.name).toBe('')
    expect(form.discount_type).toBe('percentage')
    expect(form.status).toBe('active')
  })

  it('TC018: should set usage_limit_per_customer to 1 by default', () => {
    const form = createDefaultVoucherForm()
    expect(form.usage_limit_per_customer).toBe(1)
  })

  it('TC019: should set applicable_to to "all" by default', () => {
    const form = createDefaultVoucherForm()
    expect(form.applicable_to).toBe('all')
  })
})

describe('normalizeNumber - Number Normalization', () => {
  it('TC020: should return undefined for null', () => {
    expect(normalizeNumber(null)).toBeUndefined()
  })

  it('TC021: should return undefined for undefined', () => {
    expect(normalizeNumber(undefined)).toBeUndefined()
  })

  it('TC022: should return undefined for NaN', () => {
    expect(normalizeNumber(NaN)).toBeUndefined()
  })

  it('TC023: should return the number for valid numbers', () => {
    expect(normalizeNumber(100)).toBe(100)
    expect(normalizeNumber(0)).toBe(0)
    expect(normalizeNumber(-50)).toBe(-50)
  })
})

describe('serializeVoucherPayload - Payload Serialization', () => {
  it('TC024: should trim whitespace from string fields', () => {
    const form = createDefaultVoucherForm()
    form.voucher_code = '  CODE123  '
    form.name = '  Test Voucher  '
    
    const payload = serializeVoucherPayload(form)
    expect(payload.voucher_code).toBe('CODE123')
    expect(payload.name).toBe('Test Voucher')
  })

  it('TC025: should include max_discount_amount for percentage type', () => {
    const form = createDefaultVoucherForm()
    form.discount_type = 'percentage'
    form.max_discount_amount = 50000
    
    const payload = serializeVoucherPayload(form)
    expect(payload.max_discount_amount).toBe(50000)
  })

  it('TC026: should convert dates to ISO string format', () => {
    const form = createDefaultVoucherForm()
    const testDate = new Date('2025-01-01').getTime()
    form.start_date = testDate
    form.end_date = testDate
    
    const payload = serializeVoucherPayload(form)
    expect(payload.start_date).toContain('2025-01-01')
  })
})

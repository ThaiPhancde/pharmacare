/**
 * Test Suite: Utils Functions
 * Kiểm thử các hàm tiện ích trong lib/utils.ts
 * 
 * Mục đích: Đảm bảo các utility functions hoạt động chính xác
 * - formatVND: Định dạng số tiền theo chuẩn VND Việt Nam
 * 
 * Công nghệ: Vitest, TypeScript, Intl.NumberFormat
 */
import { describe, it, expect } from 'vitest'

// Import trực tiếp từ project để test hàm thực tế
import { formatVND } from '@/lib/utils'

describe('formatVND - Currency Formatting', () => {
  it('TC001: should format positive number to VND currency', () => {
    const result = formatVND(100000)
    expect(result).toContain('100.000')
    expect(result).toContain('₫')
  })

  it('TC002: should return "0 ₫" for zero value', () => {
    const result = formatVND(0)
    expect(result).toBe('0 ₫')
  })

  it('TC003: should return "0 ₫" for undefined/null value', () => {
    const result = formatVND(undefined as any)
    expect(result).toBe('0 ₫')
  })

  it('TC004: should format large numbers correctly', () => {
    const result = formatVND(1000000000)
    expect(result).toContain('1.000.000.000')
  })

  it('TC005: should format decimal numbers without fraction digits', () => {
    const result = formatVND(50000.75)
    expect(result).toContain('50.001') // Rounded
  })
})

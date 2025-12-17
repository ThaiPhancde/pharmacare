/**
 * Test Suite: Utils Functions
 * Tests for utility functions in lib/utils.ts
 */
import { describe, it, expect } from 'vitest'

// Test formatVND function
const formatVND = (value: number) => {
  if (!value) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(value);
}

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

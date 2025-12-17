/**
 * Test Suite: Pagination Functions
 * Tests for composables/usePaginationData.ts logic
 */
import { describe, it, expect } from 'vitest'

// Pagination logic extracted for testing
interface PaginationState {
  page: number
  limit: number
  total: number
}

const calculateTotalPages = (pagination: PaginationState): number => {
  return Math.ceil(pagination.total / pagination.limit)
}

const calculateStt = (page: number, limit: number, index: number): number => {
  return (page - 1) * limit + index + 1
}

const isValidPage = (page: number, totalPages: number): boolean => {
  return page >= 1 && page <= totalPages
}

const getPageRange = (currentPage: number, totalPages: number, range: number = 2): number[] => {
  const start = Math.max(1, currentPage - range)
  const end = Math.min(totalPages, currentPage + range)
  const pages: number[] = []
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
}

describe('calculateTotalPages - Pagination Calculation', () => {
  it('TC037: should calculate total pages correctly', () => {
    const pagination: PaginationState = { page: 1, limit: 10, total: 100 }
    expect(calculateTotalPages(pagination)).toBe(10)
  })

  it('TC038: should round up for partial pages', () => {
    const pagination: PaginationState = { page: 1, limit: 10, total: 25 }
    expect(calculateTotalPages(pagination)).toBe(3)
  })

  it('TC039: should return 0 for empty total', () => {
    const pagination: PaginationState = { page: 1, limit: 10, total: 0 }
    expect(calculateTotalPages(pagination)).toBe(0)
  })
})

describe('calculateStt - Sequence Number Calculation', () => {
  it('TC040: should calculate STT for first page correctly', () => {
    expect(calculateStt(1, 10, 0)).toBe(1)
    expect(calculateStt(1, 10, 4)).toBe(5)
    expect(calculateStt(1, 10, 9)).toBe(10)
  })

  it('TC041: should calculate STT for subsequent pages', () => {
    expect(calculateStt(2, 10, 0)).toBe(11)
    expect(calculateStt(3, 10, 0)).toBe(21)
    expect(calculateStt(5, 20, 5)).toBe(86)
  })
})

describe('isValidPage - Page Validation', () => {
  it('TC042: should return true for valid page numbers', () => {
    expect(isValidPage(1, 10)).toBe(true)
    expect(isValidPage(5, 10)).toBe(true)
    expect(isValidPage(10, 10)).toBe(true)
  })

  it('TC043: should return false for invalid page numbers', () => {
    expect(isValidPage(0, 10)).toBe(false)
    expect(isValidPage(-1, 10)).toBe(false)
    expect(isValidPage(11, 10)).toBe(false)
  })
})

describe('getPageRange - Page Range Calculation', () => {
  it('TC044: should return correct range around current page', () => {
    const range = getPageRange(5, 10, 2)
    expect(range).toEqual([3, 4, 5, 6, 7])
  })

  it('TC045: should handle edge case at first page', () => {
    const range = getPageRange(1, 10, 2)
    expect(range).toEqual([1, 2, 3])
  })

  it('TC046: should handle edge case at last page', () => {
    const range = getPageRange(10, 10, 2)
    expect(range).toEqual([8, 9, 10])
  })
})

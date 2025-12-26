/**
 * Test Suite: Authentication & Role-based Access Control
 * Kiểm thử các hàm xác thực và phân quyền trong utils/auth.ts
 * 
 * Mục đích: Đảm bảo hệ thống RBAC (Role-Based Access Control) hoạt động đúng
 * - normalizeRole: Chuẩn hóa chuỗi role từ API/cookies
 * - getAllowedPathsForRole: Lấy danh sách đường dẫn được phép theo vai trò
 * - isRouteAllowed: Kiểm tra quyền truy cập route
 * 
 * Công nghệ: Vitest, TypeScript
 */
import { describe, it, expect } from 'vitest'

// Import trực tiếp từ project để test các hàm thực tế
import { 
  normalizeRole, 
  getAllowedPathsForRole, 
  isRouteAllowed,
  ROLE_ALLOWED_PATHS 
} from '@/utils/auth'

describe('normalizeRole - Role Normalization', () => {
  it('TC006: should normalize uppercase role to lowercase', () => {
    expect(normalizeRole('ADMIN')).toBe('admin')
    expect(normalizeRole('Sales')).toBe('sales')
  })

  it('TC007: should trim whitespace from role string', () => {
    expect(normalizeRole('  admin  ')).toBe('admin')
    expect(normalizeRole(' warehouse ')).toBe('warehouse')
  })

  it('TC008: should return empty string for null/undefined', () => {
    expect(normalizeRole(null)).toBe('')
    expect(normalizeRole(undefined)).toBe('')
  })
})

describe('getAllowedPathsForRole - Get Allowed Paths', () => {
  it('TC009: should return all paths (*) for admin role', () => {
    const paths = getAllowedPathsForRole('admin')
    expect(paths).toContain('*')
  })

  it('TC010: should return sales paths for sales role', () => {
    const paths = getAllowedPathsForRole('sales')
    expect(paths).toContain('/invoice')
    expect(paths).toContain('/customers')
    expect(paths).not.toContain('/suppliers')
  })

  it('TC011: should return warehouse paths for warehouse role', () => {
    const paths = getAllowedPathsForRole('warehouse')
    expect(paths).toContain('/suppliers')
    expect(paths).toContain('/purchase')
    expect(paths).not.toContain('/invoice')
  })

  it('TC012: should return empty array for unknown role', () => {
    const paths = getAllowedPathsForRole('unknown_role')
    expect(paths).toEqual([])
  })
})

describe('isRouteAllowed - Route Permission Check', () => {
  it('TC013: admin should have access to all routes', () => {
    expect(isRouteAllowed('admin', '/any/route')).toBe(true)
    expect(isRouteAllowed('admin', '/admin/settings')).toBe(true)
  })

  it('TC014: sales should have access to invoice routes', () => {
    expect(isRouteAllowed('sales', '/invoice')).toBe(true)
    expect(isRouteAllowed('sales', '/invoice/create')).toBe(true)
  })

  it('TC015: sales should NOT have access to supplier routes', () => {
    expect(isRouteAllowed('sales', '/suppliers')).toBe(false)
    expect(isRouteAllowed('sales', '/purchase')).toBe(false)
  })

  it('TC016: warehouse should have access to purchase routes', () => {
    expect(isRouteAllowed('warehouse', '/purchase')).toBe(true)
    expect(isRouteAllowed('warehouse', '/suppliers')).toBe(true)
  })
})

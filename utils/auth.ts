// Role-based access control configuration
// '*' means full access
export const ROLE_ALLOWED_PATHS: Record<string, string[]> = {
  admin: ['*'],
  sales: [
    '/',
    '/invoice',
    '/customers',
    '/medicine',
    '/stock',
    '/bank',
    '/returns',
    '/report',
  ],
  warehouse: [
    '/',
    '/suppliers',
    '/medicine',
    '/stock',
    '/purchase',
    '/bank',
  ],
};

// Normalize role strings coming from API/cookies (e.g. "Sale" → "sales")
export const normalizeRole = (role: string | undefined | null) => {
  return (role || '').toLowerCase().trim();
};

export const getAllowedPathsForRole = (role: string) => {
  const normalized = normalizeRole(role);
  return ROLE_ALLOWED_PATHS[normalized] || [];
};

export const isRouteAllowed = (role: string, path: string) => {
  const normalized = normalizeRole(role);
  if (normalized === 'admin') return true;
  const allowed = getAllowedPathsForRole(normalized);
  return allowed.some(prefix => path === prefix || path.startsWith(prefix + '/'));
};

// Filter nav items by role for sidebar menu
export const filterMenuItemsByRole = (items: any[], role: string): any[] => {
  const normalized = normalizeRole(role);
  if (normalized === 'admin') return items;
  const allowed = getAllowedPathsForRole(normalized);

  const filterItems = (list: any[]): any[] => {
    return list
      .map(item => {
        if ('children' in item) {
          const children = filterItems(item.children || []);
          return { ...item, children };
        }
        return item;
      })
      .filter(item => {
        if ('children' in item) {
          return item.children && item.children.length > 0;
        }
        return allowed.some(prefix => item.link === prefix || (item.link || '').startsWith(prefix + '/'));
      });
  };

  return filterItems(items);
};

export const logout = () => {
  const cookie = useCookie("userAuth");
  cookie.value = null;
  
  // Clear notification session so it shows again on next login
  if (import.meta.client) {
    sessionStorage.removeItem('expiringMedicinesShown');
  }
  
  navigateTo('/login')
};

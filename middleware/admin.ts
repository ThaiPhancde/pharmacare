import { isRouteAllowed, normalizeRole } from '@/utils/auth';

export default defineNuxtRouteMiddleware((to) => {
  const userCookie = useCookie<{ role?: string } | null>("userInfo");
  
  if (!userCookie.value) {
    return navigateTo("/login");
  }
  
  // Nuxt useCookie auto-deserializes - no need JSON.parse
  const user = userCookie.value;
  const role = normalizeRole(user.role);

  // Nếu là admin, cho phép tất cả
  if (role === 'admin') return;

  // Kiểm tra quyền admin pages
  if (to.path.startsWith("/admin") && role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "You don't have permission to access this page"
    });
  }

  // Kiểm tra theo RBAC mapping
  if (!isRouteAllowed(role, to.path)) {
    throw createError({
      statusCode: 403,
      statusMessage: "You don't have permission to access this page"
    });
  }
}); 
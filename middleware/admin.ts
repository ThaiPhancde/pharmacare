export default defineNuxtRouteMiddleware((to) => {
  const userCookie = useCookie("userInfo");
  
  if (!userCookie.value) {
    return navigateTo("/login");
  }
  
  try {
    const user = JSON.parse(userCookie.value as string);
    
    // Kiểm tra quyền admin cho các trang admin
    if (to.path.startsWith("/admin") && user.role !== "admin") {
      throw createError({
        statusCode: 403,
        statusMessage: "You don't have permission to access this page"
      });
    }
    
    // Kiểm tra quyền warehouse cho các trang stock/purchase
    if ((to.path.startsWith("/stock") || to.path.startsWith("/purchase")) && 
        !["admin", "warehouse"].includes(user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: "You don't have permission to access this page"
      });
    }
  } catch (error) {
    return navigateTo("/login");
  }
}); 
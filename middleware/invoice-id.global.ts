/**
 * Middleware toàn cục để chuẩn hóa ID trong các tham số URL
 * Xử lý các ID có khoảng trắng và đảm bảo định dạng nhất quán
 */
export default defineNuxtRouteMiddleware((to, from) => {
  // Kiểm tra nếu đang truy cập trang invoice detail
  if (to.path.includes('/invoice/') && to.params.id) {
    const rawId = to.params.id;
    
    // Nếu ID là chuỗi và có chứa khoảng trắng, chuẩn hóa và redirect
    if (typeof rawId === 'string' && rawId.includes(' ')) {
      console.log(`Normalizing invoice ID in URL: ${rawId}`);
      
      // Chuẩn hóa ID bằng cách thay thế khoảng trắng bằng dấu gạch ngang
      const normalizedId = rawId.replace(/\s+/g, '-').toUpperCase();
      
      // Ngăn chặn vòng lặp redirect
      if (normalizedId !== rawId) {
        console.log(`Redirecting to normalized ID: ${normalizedId}`);
        
        // Tạo URL mới với ID đã chuẩn hóa
        const newPath = to.path.replace(rawId, normalizedId);
        return navigateTo(newPath, { redirectCode: 301 });
      }
    }
  }
}); 
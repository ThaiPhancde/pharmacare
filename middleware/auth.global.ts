export default defineNuxtRouteMiddleware((to) => {
  // Bỏ qua trang đăng nhập, tránh vòng lặp redirect
  if (to.path === "/login" || to.path === "/register" || to.path === "/forgot-password") return;

  const userAuth = useCookie("userAuth");

  // Nếu không có userAuth, chuyển hướng đến trang đăng nhập
  if (!userAuth.value) {
    return navigateTo("/login", { replace: true });
  }
});

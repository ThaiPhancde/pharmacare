export const logout = () => {
  const cookie = useCookie("userAuth");
  cookie.value = null;
  navigateTo('/login')
};

export const logout = () => {
  const cookie = useCookie("userAuth");
  cookie.value = null;
  
  // Clear notification session so it shows again on next login
  if (import.meta.client) {
    sessionStorage.removeItem('expiringMedicinesShown');
  }
  
  navigateTo('/login')
};

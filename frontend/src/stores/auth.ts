import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const isAuthenticated = ref(false);

  function setAuthenticated(value: boolean) {
    isAuthenticated.value = value;
  }

  function clearAuth() {
    isAuthenticated.value = false;
  }

  return { isAuthenticated, setAuthenticated, clearAuth };
});

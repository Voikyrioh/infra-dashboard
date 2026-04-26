import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useAuthStore = defineStore("auth", () => {
	const authKey = ref<string | null>(null);

	const isAuthenticated = computed(() => authKey.value !== null);

	function setAuth(key: string) {
		authKey.value = key;
	}

	function clearAuth() {
		authKey.value = null;
	}

	return { authKey, isAuthenticated, setAuth, clearAuth };
});

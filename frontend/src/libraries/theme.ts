import { ref, watchEffect } from "vue";

const isDark = ref(true);

const stored = localStorage.getItem("theme");
if (stored === "light") isDark.value = false;
else if (stored === "dark") isDark.value = true;
else isDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;

watchEffect(() => {
	document.documentElement.setAttribute(
		"data-theme",
		isDark.value ? "dark" : "light",
	);
	localStorage.setItem("theme", isDark.value ? "dark" : "light");
});

export function useTheme() {
	function toggle() {
		isDark.value = !isDark.value;
	}

	return { isDark, toggle };
}

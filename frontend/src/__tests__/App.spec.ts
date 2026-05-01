import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "@/App.vue";

vi.mock("@/libraries/theme", () => ({
	useTheme: () => ({ isDark: { value: false }, toggle: vi.fn() }),
}));

const router = createRouter({
	history: createMemoryHistory(),
	routes: [
		{ path: "/", component: { template: "<div/>" } },
		{ path: "/dashboard", component: { template: "<div/>" } },
		{ path: "/applications", component: { template: "<div/>" } },
		{ path: "/connexion", component: { template: "<div/>" } },
	],
});

describe("App", () => {
	it("mounts properly with sidebar layout", () => {
		const wrapper = mount(App, {
			global: { plugins: [createPinia(), router] },
		});
		expect(wrapper.find(".app-layout").exists()).toBe(true);
		expect(wrapper.find(".app-sidebar").exists()).toBe(true);
	});
});

import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import AppHeader from "./AppHeader.vue";

vi.mock("@/libraries/theme", () => ({
	useTheme: () => ({ isDark: { value: true }, toggle: vi.fn() }),
}));

const router = createRouter({
	history: createMemoryHistory(),
	routes: [{ path: "/", component: { template: "<div/>" } }],
});

describe("AppHeader", () => {
	it("renders the logo", () => {
		const wrapper = mount(AppHeader, {
			global: { plugins: [createPinia(), router] },
		});
		expect(wrapper.find(".app-header__logo-text").text()).toBe("dashboard");
	});

	it("does not show logout button when not authenticated", () => {
		const wrapper = mount(AppHeader, {
			global: { plugins: [createPinia(), router] },
		});
		expect(wrapper.find(".app-header__logout-btn").exists()).toBe(false);
	});

	it("shows theme toggle button", () => {
		const wrapper = mount(AppHeader, {
			global: { plugins: [createPinia(), router] },
		});
		expect(wrapper.find(".app-header__theme-btn").exists()).toBe(true);
	});
});

import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import App from "../App.vue";

const router = createRouter({
	history: createMemoryHistory(),
	routes: [{ path: "/", component: { template: "<div/>" } }],
});

describe("App", () => {
	it("mounts properly with header", () => {
		const wrapper = mount(App, {
			global: { plugins: [createPinia(), router] },
		});
		expect(wrapper.find(".app-header").exists()).toBe(true);
	});
});

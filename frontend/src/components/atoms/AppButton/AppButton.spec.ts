import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import AppButton from "./AppButton.vue";

describe("AppButton", () => {
	it("renders slot content", () => {
		const wrapper = mount(AppButton, { slots: { default: "Connexion" } });
		expect(wrapper.text()).toContain("Connexion");
	});

	it("applies primary variant by default", () => {
		const wrapper = mount(AppButton);
		expect(wrapper.classes()).toContain("app-btn--primary");
	});

	it("applies the given variant class", () => {
		const wrapper = mount(AppButton, { props: { variant: "secondary" } });
		expect(wrapper.classes()).toContain("app-btn--secondary");
	});

	it("is disabled when disabled prop is true", () => {
		const wrapper = mount(AppButton, { props: { disabled: true } });
		expect(wrapper.attributes("disabled")).toBeDefined();
	});

	it("is disabled when loading", () => {
		const wrapper = mount(AppButton, { props: { loading: true } });
		expect(wrapper.attributes("disabled")).toBeDefined();
		expect(wrapper.classes()).toContain("app-btn--loading");
	});

	it("renders spinner when loading", () => {
		const wrapper = mount(AppButton, { props: { loading: true } });
		expect(wrapper.find(".app-btn__spinner").exists()).toBe(true);
	});
});

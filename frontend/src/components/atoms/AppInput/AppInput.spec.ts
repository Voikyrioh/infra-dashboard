import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import AppInput from "./AppInput.vue";

describe("AppInput", () => {
	it("renders with label", () => {
		const wrapper = mount(AppInput, {
			props: { label: "Mot de passe", modelValue: "" },
		});
		expect(wrapper.text()).toContain("Mot de passe");
	});

	it("emits update:modelValue on input", async () => {
		const wrapper = mount(AppInput, { props: { modelValue: "" } });
		const input = wrapper.find("input");
		await input.setValue("test");
		expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["test"]);
	});

	it("shows error message", () => {
		const wrapper = mount(AppInput, {
			props: { modelValue: "", error: "Champ requis" },
		});
		expect(wrapper.find("[role='alert']").text()).toBe("Champ requis");
	});

	it("shows password toggle when type is password", () => {
		const wrapper = mount(AppInput, {
			props: { modelValue: "", type: "password" },
		});
		expect(wrapper.find(".app-input__toggle").exists()).toBe(true);
	});

	it("toggles password visibility", async () => {
		const wrapper = mount(AppInput, {
			props: { modelValue: "", type: "password" },
		});
		const input = wrapper.find("input");
		expect(input.attributes("type")).toBe("password");
		await wrapper.find(".app-input__toggle").trigger("click");
		expect(input.attributes("type")).toBe("text");
	});
});

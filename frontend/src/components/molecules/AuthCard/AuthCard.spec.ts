import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import AuthCard from "./AuthCard.vue";

describe("AuthCard", () => {
	it("renders title and subtitle", () => {
		const wrapper = mount(AuthCard, {
			props: { title: "Connexion", subtitle: "Utilisez votre passkey" },
		});
		expect(wrapper.find(".auth-card__title").text()).toBe("Connexion");
		expect(wrapper.find(".auth-card__subtitle").text()).toBe(
			"Utilisez votre passkey",
		);
	});

	it("hides header when no title nor subtitle", () => {
		const wrapper = mount(AuthCard);
		expect(wrapper.find(".auth-card__header").exists()).toBe(false);
	});

	it("renders slot content in body", () => {
		const wrapper = mount(AuthCard, {
			slots: { default: "<p>Contenu</p>" },
		});
		expect(wrapper.find(".auth-card__body").text()).toBe("Contenu");
	});

	it("renders custom icon slot", () => {
		const wrapper = mount(AuthCard, {
			props: { title: "Test" },
			slots: { icon: "<span class='custom-icon'>★</span>" },
		});
		expect(wrapper.find(".custom-icon").exists()).toBe(true);
	});
});

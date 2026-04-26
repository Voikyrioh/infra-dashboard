import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import LoginPage from "./LoginPage.vue";

const mockPasskeyOptions: PublicKeyCredentialCreationOptionsJSON = {
	challenge: "bW9ja0NoYWxsZW5nZQ",
	user: { id: "bW9ja1VzZXJJZA", name: "owner", displayName: "owner" },
	rp: { id: "localhost", name: "Dashboard" },
	pubKeyCredParams: [{ type: "public-key", alg: -7 }],
	timeout: 60000,
	excludeCredentials: [],
	authenticatorSelection: {},
	attestation: "none",
	extensions: {},
};

vi.mock("@/services/auth.service", () => ({
	checkAuthStatus: vi.fn().mockResolvedValue({ status: "need-auth" }),
	initFirstAuth: vi.fn(),
	getLoginChallenge: vi.fn(),
	verifyPasskey: vi.fn(),
}));

vi.mock("@/libraries/webauthn", () => ({
	startRegistration: vi.fn(),
	startAuthentication: vi.fn(),
}));

const router = createRouter({
	history: createMemoryHistory(),
	routes: [
		{ path: "/connexion", component: LoginPage },
		{ path: "/dashboard", component: { template: "<div/>" } },
	],
});

describe("LoginPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows loading state initially", () => {
		const wrapper = mount(LoginPage, {
			global: { plugins: [createPinia(), router] },
		});
		expect(wrapper.find(".login-page__loader").exists()).toBe(true);
	});

	it("shows login state after checkAuthStatus returns need-auth", async () => {
		const { checkAuthStatus } = await import("@/services/auth.service");
		vi.mocked(checkAuthStatus).mockResolvedValue({ status: "need-auth" });

		const wrapper = mount(LoginPage, {
			global: { plugins: [createPinia(), router] },
		});
		await flushPromises();
		expect(wrapper.text()).toContain("Connexion");
	});

	it("shows setup state after checkAuthStatus returns need-first-auth", async () => {
		const { checkAuthStatus } = await import("@/services/auth.service");
		vi.mocked(checkAuthStatus).mockResolvedValue({
			status: "need-first-auth",
			passkeyOptions: mockPasskeyOptions,
		});

		const wrapper = mount(LoginPage, {
			global: { plugins: [createPinia(), router] },
		});
		await flushPromises();
		expect(wrapper.text()).toContain("Configuration initiale");
	});
});

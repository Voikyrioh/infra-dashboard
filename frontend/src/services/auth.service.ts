import type {
	AuthenticationResponseJSON,
	RegistrationResponseJSON,
} from "@/libraries/webauthn";
import router from "@/router";
import { useAuthStore } from "@/stores/auth";

export type BackendAuthStatus = "need-first-auth" | "need-auth" | "connected";

export interface AuthStatusResponse {
	status: BackendAuthStatus;
	passkeyOptions?: PublicKeyCredentialCreationOptionsJSON;
}

export interface AuthKeyResponse {
	token: string;
}

export async function checkAuthStatus(): Promise<AuthStatusResponse> {
	const res = await fetch(`http://localhost:8081/api/v1/auth/status`);
	if (!res.ok) throw new Error("Impossible de joindre le serveur.");
	return res.json();
}

export async function initFirstAuth(
	password: string,
	registrationResponse: RegistrationResponseJSON,
): Promise<AuthKeyResponse> {
	const res = await fetch("http://localhost:8081/api/v1/auth", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ password, registrationResponse }),
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.message ?? "Erreur lors de la configuration.");
	}
	return res.json();
}

export async function getLoginChallenge(): Promise<{ challenge: string }> {
	// TODO: implement GET /api/v1/auth/challenge when login flow is built
	throw new Error("Login flow not yet implemented.");
}

export async function verifyPasskey(
	_credential: AuthenticationResponseJSON,
): Promise<AuthKeyResponse> {
	// TODO: implement POST /api/v1/auth/ when login flow is built
	throw new Error("Login flow not yet implemented.");
}

export function handle401() {
	const auth = useAuthStore();
	auth.clearAuth();
	router.push("/connexion");
}

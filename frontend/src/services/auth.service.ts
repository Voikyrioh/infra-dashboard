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

const BASE = "/api/v1/auth";

export async function checkAuthStatus(): Promise<AuthStatusResponse> {
  const res = await fetch(`${BASE}/status`);
  if (!res.ok) throw new Error("Impossible de joindre le serveur.");
  return res.json();
}

export async function initFirstAuth(
  password: string,
  registrationResponse: RegistrationResponseJSON,
): Promise<void> {
  const res = await fetch(BASE, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, registrationResponse }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Erreur lors de la configuration.");
  }
}

export async function getLoginChallenge(): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const res = await fetch(`${BASE}/challenge`);
  if (!res.ok) throw new Error("Impossible d'obtenir le challenge.");
  return res.json();
}

export async function verifyPasskey(
  authenticationResponse: AuthenticationResponseJSON,
): Promise<void> {
  const res = await fetch(`${BASE}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ authenticationResponse }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Authentification échouée.");
  }
}

export async function logout(): Promise<void> {
  await fetch(BASE, { method: "DELETE" });
}

export function handle401() {
  const auth = useAuthStore();
  auth.clearAuth();
  router.push("/connexion");
}

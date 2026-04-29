<script setup lang="ts">
import { onMounted, toRaw } from "vue";
import { useRouter } from "vue-router";
import AppButton from "@/components/atoms/AppButton/AppButton.vue";
import AppInput from "@/components/atoms/AppInput/AppInput.vue";
import AuthCard from "@/components/molecules/AuthCard/AuthCard.vue";
import { startAuthentication, startRegistration } from "@/libraries/webauthn";
import {
	checkAuthStatus,
	getLoginChallenge,
	initFirstAuth,
	verifyPasskey,
} from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth";
import { useLoginStore } from "./login.store";

const login = useLoginStore();
const auth = useAuthStore();
const router = useRouter();

onMounted(async () => {
	login.reset();
	try {
		const response = await checkAuthStatus();
		if (response.status === "connected") {
			auth.setAuthenticated(true);
			router.push("/dashboard");
			return;
		}
		if (response.passkeyOptions) {
			login.setPasskeyOptions(response.passkeyOptions);
		}
		const mapped = response.status === "need-first-auth" ? "setup" : "login";
		login.setState(mapped);
	} catch {
		login.setError("Impossible de joindre le serveur.");
	}
});

async function handleSetup() {
	if (!login.password.trim() || !login.passkeyOptions) return;
	login.setState("creating-passkey");
	try {
		const credential = await startRegistration({ optionsJSON: toRaw(login.passkeyOptions) });
		await initFirstAuth(login.password, credential);
		auth.setAuthenticated(true);
		router.push("/dashboard");
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Erreur lors de la configuration.";
		login.setError(message);
	}
}

async function handleLogin() {
	login.setState("authenticating");
	try {
		const options = await getLoginChallenge();
		const credential = await startAuthentication({ optionsJSON: options });
		await verifyPasskey(credential);
		auth.setAuthenticated(true);
		router.push("/dashboard");
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Authentification échouée.";
		login.setError(message);
	}
}

function retryLogin() {
	login.setState("login");
}
</script>

<template>
	<div class="login-page">
		<div class="login-page__bg-orb login-page__bg-orb--1" aria-hidden="true" />
		<div class="login-page__bg-orb login-page__bg-orb--2" aria-hidden="true" />

		<div class="login-page__content">
			<!-- Loading -->
			<div v-if="login.pageState === 'loading'" class="login-page__loader animate-fade-up">
				<div class="login-page__spinner" />
				<p class="login-page__loader-text font-display">Initialisation...</p>
			</div>

			<!-- Setup : création de passkey -->
			<AuthCard
				v-else-if="login.pageState === 'setup' || login.pageState === 'creating-passkey'"
				title="Configuration initiale"
				subtitle="Entrez le mot de passe administrateur pour créer votre passkey."
			>
				<template #icon>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
					</svg>
				</template>
				<form class="login-page__form" @submit.prevent="handleSetup">
					<AppInput
						v-model="login.password"
						type="password"
						label="Mot de passe administrateur"
						placeholder="••••••••••••"
						:disabled="login.pageState === 'creating-passkey'"
					/>
					<AppButton
						type="submit"
						variant="primary"
						:loading="login.pageState === 'creating-passkey'"
						:disabled="!login.password.trim()"
						class="login-page__submit"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
							<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
						</svg>
						Créer ma passkey
					</AppButton>
				</form>
			</AuthCard>

			<!-- Login : authentification par passkey -->
			<AuthCard
				v-else-if="login.pageState === 'login' || login.pageState === 'authenticating'"
				title="Connexion"
				subtitle="Authentifiez-vous avec votre passkey Dashlane."
			>
				<div class="login-page__form">
					<div class="login-page__passkey-hint">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"/>
							<line x1="12" y1="8" x2="12" y2="12"/>
							<line x1="12" y1="16" x2="12.01" y2="16"/>
						</svg>
						Votre gestionnaire de mots de passe vous demandera de valider l'authentification.
					</div>
					<AppButton
						variant="primary"
						:loading="login.pageState === 'authenticating'"
						class="login-page__submit"
						@click="handleLogin"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
							<path d="M9 12l2 2 4-4"/>
						</svg>
						Se connecter avec ma passkey
					</AppButton>
				</div>
			</AuthCard>

			<!-- Error -->
			<AuthCard
				v-else-if="login.pageState === 'error'"
				title="Erreur"
				subtitle="Une erreur est survenue."
			>
				<template #icon>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-error)">
						<circle cx="12" cy="12" r="10"/>
						<line x1="12" y1="8" x2="12" y2="12"/>
						<line x1="12" y1="16" x2="12.01" y2="16"/>
					</svg>
				</template>
				<div class="login-page__form">
					<p class="login-page__error-msg">{{ login.errorMessage }}</p>
					<AppButton variant="secondary" class="login-page__submit" @click="retryLogin">
						Réessayer la connexion
					</AppButton>
				</div>
			</AuthCard>
		</div>
	</div>
</template>

<style scoped>
.login-page {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	position: relative;
	overflow: hidden;
}

.login-page__bg-orb {
	position: fixed;
	border-radius: 50%;
	filter: blur(80px);
	pointer-events: none;
	z-index: 0;
}

.login-page__bg-orb--1 {
	width: 500px;
	height: 500px;
	background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
	top: -100px;
	right: -100px;
}

.login-page__bg-orb--2 {
	width: 400px;
	height: 400px;
	background: radial-gradient(circle, rgba(29, 78, 216, 0.08) 0%, transparent 70%);
	bottom: -80px;
	left: -80px;
}

.login-page__content {
	position: relative;
	z-index: 1;
	width: 100%;
	max-width: 420px;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.login-page__loader {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
}

.login-page__spinner {
	width: 36px;
	height: 36px;
	border: 2px solid var(--color-border);
	border-top-color: var(--color-emerald);
	border-radius: 50%;
	animation: spin-slow 0.8s linear infinite;
}

.login-page__loader-text {
	font-size: 0.8rem;
	color: var(--color-text-muted);
	letter-spacing: 0.1em;
	margin: 0;
}

.login-page__form {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.login-page__submit {
	width: 100%;
}

.login-page__passkey-hint {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	padding: 12px 14px;
	border-radius: var(--radius-md);
	background: var(--color-navy-dim);
	border: 1px solid rgba(59, 130, 246, 0.2);
	color: var(--color-text-secondary);
	font-size: 0.82rem;
	line-height: 1.5;
}

.login-page__passkey-hint svg {
	flex-shrink: 0;
	margin-top: 2px;
	color: var(--color-navy-light);
}

.login-page__error-msg {
	padding: 12px 14px;
	border-radius: var(--radius-md);
	background: var(--color-error-dim);
	border: 1px solid rgba(248, 81, 73, 0.2);
	color: var(--color-error);
	font-size: 0.875rem;
	margin: 0;
}
</style>

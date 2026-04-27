<script setup lang="ts">
import { useRouter } from "vue-router";
import { logout as apiLogout } from "@/services/auth.service";
import { useTheme } from "@/libraries/theme";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();
const { isDark, toggle } = useTheme();

async function logout() {
	await apiLogout();
	auth.clearAuth();
	router.push("/connexion");
}
</script>

<template>
	<header class="app-header">
		<div class="app-header__inner">
			<RouterLink to="/" class="app-header__logo font-display">
				<span class="app-header__logo-bracket">[</span>
				<span class="app-header__logo-text neon-text-emerald">dashboard</span>
				<span class="app-header__logo-bracket">]</span>
			</RouterLink>

			<nav class="app-header__actions">
				<button
					class="app-header__theme-btn"
					:aria-label="isDark ? 'Passer en thème clair' : 'Passer en thème sombre'"
					@click="toggle"
				>
					<svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="4"/>
						<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
					</svg>
					<svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
					</svg>
				</button>

				<button
					v-if="auth.isAuthenticated"
					class="app-header__logout-btn"
					@click="logout"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
						<polyline points="16 17 21 12 16 7"/>
						<line x1="21" y1="12" x2="9" y2="12"/>
					</svg>
					Déconnexion
				</button>
			</nav>
		</div>
	</header>
</template>

<style scoped>
.app-header {
	position: sticky;
	top: 0;
	z-index: 50;
	background: rgba(10, 14, 23, 0.8);
	backdrop-filter: blur(16px);
	-webkit-backdrop-filter: blur(16px);
	border-bottom: 1px solid var(--color-border);
}

[data-theme="light"] .app-header {
	background: rgba(240, 244, 248, 0.85);
}

.app-header__inner {
	display: flex;
	align-items: center;
	justify-content: space-between;
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 24px;
	height: 56px;
}

.app-header__logo {
	display: flex;
	align-items: center;
	gap: 1px;
	font-size: 1rem;
	font-weight: 700;
	letter-spacing: -0.02em;
	text-decoration: none;
}

.app-header__logo-bracket {
	color: var(--color-text-muted);
	font-size: 1.1rem;
}

.app-header__logo-text {
	padding: 0 2px;
}

.app-header__actions {
	display: flex;
	align-items: center;
	gap: 8px;
}

.app-header__theme-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: var(--radius-md);
	border: 1px solid var(--color-border);
	background: transparent;
	color: var(--color-text-secondary);
	cursor: pointer;
	transition: background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.app-header__theme-btn:hover {
	background: var(--color-bg-tertiary);
	color: var(--color-text-primary);
	border-color: var(--color-border-accent);
}

.app-header__logout-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 14px;
	border-radius: var(--radius-md);
	border: 1px solid var(--color-border);
	background: transparent;
	color: var(--color-text-secondary);
	font-family: var(--font-body);
	font-size: 0.85rem;
	cursor: pointer;
	transition: background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.app-header__logout-btn:hover {
	background: var(--color-error-dim);
	color: var(--color-error);
	border-color: var(--color-error);
}
</style>

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
  <aside class="app-sidebar">
    <RouterLink to="/dashboard" class="app-sidebar__logo font-display" title="Dashboard">
      <span class="app-sidebar__logo-bracket">[</span>
      <span class="neon-text-emerald">d</span>
      <span class="app-sidebar__logo-bracket">]</span>
    </RouterLink>

    <nav class="app-sidebar__nav">
      <RouterLink
        to="/dashboard"
        class="app-sidebar__nav-link"
        title="Dashboard"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      </RouterLink>

      <RouterLink
        to="/applications"
        class="app-sidebar__nav-link"
        title="Applications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
      </RouterLink>
    </nav>

    <div class="app-sidebar__bottom">
      <button
        class="app-sidebar__theme-btn"
        :aria-label="isDark ? 'Passer en thème clair' : 'Passer en thème sombre'"
        :title="isDark ? 'Thème clair' : 'Thème sombre'"
        @click="toggle"
      >
        <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>

      <button
        v-if="auth.isAuthenticated"
        class="app-sidebar__logout-btn"
        title="Déconnexion"
        @click="logout"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 56px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 4px;
  background: rgba(8, 12, 20, 0.98);
  border-right: 1px solid var(--color-border);
  z-index: 50;
}

[data-theme="light"] .app-sidebar {
  background: rgba(240, 244, 248, 0.98);
}

.app-sidebar__logo {
  display: flex;
  align-items: center;
  gap: 1px;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: -1px;
  text-decoration: none;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
  width: 100%;
  justify-content: center;
}

.app-sidebar__logo-bracket {
  color: var(--color-text-muted);
}

.app-sidebar__nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.app-sidebar__nav-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  color: rgba(255, 255, 255, 0.35);
  text-decoration: none;
  transition: background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

[data-theme="light"] .app-sidebar__nav-link {
  color: rgba(0, 0, 0, 0.35);
}

.app-sidebar__nav-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
}

[data-theme="light"] .app-sidebar__nav-link:hover {
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.6);
}

.app-sidebar__nav-link.router-link-active {
  background: rgba(52, 211, 153, 0.15);
  border-color: rgba(52, 211, 153, 0.4);
  color: #34d399;
}

.app-sidebar__bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.app-sidebar__theme-btn,
.app-sidebar__logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.app-sidebar__theme-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-color: var(--color-border-accent);
}

.app-sidebar__logout-btn:hover {
  background: var(--color-error-dim);
  color: var(--color-error);
  border-color: var(--color-error);
}
</style>

# Feature 2 Completion (DASH-7 à DASH-10) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compléter Feature 2 — filtrer le repo dashboard de la détection GitHub, créer le workflow réutilisable, réécrire le template exemple, et remplacer l'AppHeader par une sidebar icônes.

**Architecture:** Trois changements indépendants : (1) correction d'un filtre dans le service GitHub backend, (2) restructuration des workflows GitHub Actions, (3) nouveau composant sidebar frontend qui remplace AppHeader dans App.vue.

**Tech Stack:** TypeScript/Hono (backend), Vue 3 + Pinia (frontend), Vitest + Vue Test Utils (tests frontend), Mocha + Chai (tests backend), GitHub Actions workflow_call.

---

## Fichiers touchés

| Fichier | Action |
|---|---|
| `backend/src/domain/use-cases/apps/github/github-search.service.ts` | Modifier — ajouter filtre repo `dashboard` |
| `backend/src/domain/use-cases/apps/__tests__/github.service.test.ts` | Modifier — ajouter test du filtre |
| `.github/workflows/build-deploy.yml` | Créer — workflow réutilisable (`workflow_call`) |
| `examples/build-deploy.yml` | Modifier — thin caller template |
| `frontend/src/components/molecules/AppSidebar/AppSidebar.vue` | Créer — sidebar icônes + tooltip |
| `frontend/src/components/molecules/AppSidebar/AppSidebar.spec.ts` | Créer — tests unitaires sidebar |
| `frontend/src/App.vue` | Modifier — remplacer AppHeader par AppSidebar, nouveau layout flex |
| `frontend/src/components/molecules/AppHeader/AppHeader.vue` | Supprimer |
| `frontend/src/components/molecules/AppHeader/AppHeader.spec.ts` | Supprimer |

---

## Task 1 — Filtre repo dashboard dans la détection GitHub

**Files:**
- Modify: `backend/src/domain/use-cases/apps/github/github-search.service.ts`
- Modify: `backend/src/domain/use-cases/apps/__tests__/github.service.test.ts`

- [ ] **Step 1 : Ajouter le test du filtre dans `github.service.test.ts`**

Dans le `describe('github-search.service', ...)`, ajouter ce test après le test existant "retourne les repos trouvés" :

```typescript
it('filtre le repo dashboard des résultats', async () => {
  mockFetch({
    ok: true,
    json: async () => ({
      items: [
        { repository: { name: 'dashboard', html_url: 'https://github.com/voikyrioh/dashboard' } },
        { repository: { name: 'my-app', html_url: 'https://github.com/voikyrioh/my-app' } },
      ],
    }),
  })
  const results = await searchAppsOnGitHub()
  expect(results).to.have.length(1)
  expect(results[0].repoName).to.equal('my-app')
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd backend && npm test
```

Résultat attendu : FAIL — "expected [ Array(2) ] to have a length of 1 but got 2"

- [ ] **Step 3 : Ajouter le filtre dans `github-search.service.ts`**

Remplacer le `return` final :

```typescript
// Avant
return data.items.map((item) => ({
  repoName: item.repository.name,
  repoUrl: item.repository.html_url,
}))

// Après
return data.items
  .filter((item) => item.repository.name !== 'dashboard')
  .map((item) => ({
    repoName: item.repository.name,
    repoUrl: item.repository.html_url,
  }))
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils passent**

```bash
cd backend && npm test
```

Résultat attendu : tous les tests `github-search.service` et `github-actions.service` passent.

- [ ] **Step 5 : Commit**

```bash
git add backend/src/domain/use-cases/apps/github/github-search.service.ts \
        backend/src/domain/use-cases/apps/__tests__/github.service.test.ts
git commit -m "fix(DASH-8): filter dashboard repo from GitHub app detection results"
```

---

## Task 2 — Workflow réutilisable + template exemple

**Files:**
- Create: `.github/workflows/build-deploy.yml`
- Modify: `examples/build-deploy.yml`

Pas de tests automatisés pour les workflows GitHub Actions.

- [ ] **Step 1 : Créer `.github/workflows/build-deploy.yml` comme workflow réutilisable**

```yaml
# Reusable workflow — called by app repos via `uses: voikyrioh/dashboard/.github/workflows/build-deploy.yml@main`
# The dashboard detects repositories calling this workflow via GitHub Search API.

name: Build & Deploy (reusable)

on:
  workflow_call:
    inputs:
      app-name:
        description: "App name — used for Docker image tag and SSH deploy path"
        required: true
        type: string
      tag:
        description: "Version tag (ex: v1.0.0)"
        required: true
        type: string
    secrets:
      SSH_PRIVATE_KEY:
        required: true
      SSH_HOST:
        required: true
      SSH_PORT:
        required: true
      SSH_USER:
        required: true
      SSH_HOST_FINGERPRINT:
        required: true

jobs:
  create_release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: read
    steps:
      - name: Validate tag format
        run: |
          if ! echo "${{ inputs.tag }}" | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+$'; then
            echo "Error: tag must match vX.Y.Z (e.g. v1.0.0)"
            exit 1
          fi
      - uses: actions/checkout@v4
      - name: Create GitHub release
        run: |
          gh release create "${{ inputs.tag }}" \
            --repo="$GITHUB_REPOSITORY" \
            --title="${{ inputs.app-name }} ${{ inputs.tag }}" \
            --generate-notes
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  publish_image:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/${{ inputs.app-name }}:${{ inputs.tag }}
            ghcr.io/${{ github.repository_owner }}/${{ inputs.app-name }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: [create_release, publish_image]
    runs-on: ubuntu-latest
    permissions: {}
    steps:
      - name: Install SSH key
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          echo "${{ secrets.SSH_HOST_FINGERPRINT }}" >> ~/.ssh/known_hosts
      - name: Deploy to VPS
        run: |
          ssh -p ${{ secrets.SSH_PORT }} ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} << 'EOF'
            cd /opt/infra/apps/${{ inputs.app-name }}
            grep -q '^IMAGE_TAG=' .env && \
              sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=${{ inputs.tag }}/" .env || \
              echo "IMAGE_TAG=${{ inputs.tag }}" >> .env
            docker compose pull
            docker compose up -d --remove-orphans
          EOF
      - name: Cleanup SSH
        if: always()
        run: rm -rf ~/.ssh
```

- [ ] **Step 2 : Réécrire `examples/build-deploy.yml` comme thin caller**

Remplacer l'intégralité du fichier par :

```yaml
# Template: copy to .github/workflows/build-deploy.yml in your app repo.
# The dashboard detects repositories using this workflow via GitHub Search API.
#
# Before using:
#   1. Replace <app-name> with your app's name (e.g. my-app) — only line to change
#   2. Set GitHub secrets in your repo settings:
#      SSH_PRIVATE_KEY, SSH_HOST, SSH_PORT, SSH_USER, SSH_HOST_FINGERPRINT
#      SSH_HOST_FINGERPRINT: run `ssh-keyscan -p <port> <host>` and paste the output line
#   3. Create /opt/infra/apps/<app-name>/.env on the VPS with IMAGE_TAG=latest
#   4. Create /opt/infra/apps/<app-name>/docker-compose.yml on the VPS

name: Build & Deploy

on:
  workflow_dispatch:
    inputs:
      tag:
        description: "Version tag (ex: v1.0.0)"
        required: true

jobs:
  deploy:
    uses: voikyrioh/dashboard/.github/workflows/build-deploy.yml@main
    with:
      app-name: <app-name>
      tag: ${{ inputs.tag }}
    secrets: inherit
```

- [ ] **Step 3 : Commit**

```bash
git add .github/workflows/build-deploy.yml examples/build-deploy.yml
git commit -m "feat(DASH-7): create reusable build-deploy workflow and update caller template"
```

---

## Task 3 — Composant AppSidebar

**Files:**
- Create: `frontend/src/components/molecules/AppSidebar/AppSidebar.vue`
- Create: `frontend/src/components/molecules/AppSidebar/AppSidebar.spec.ts`

- [ ] **Step 1 : Créer `AppSidebar.spec.ts` avec les tests**

```typescript
import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import AppSidebar from "./AppSidebar.vue";

vi.mock("@/libraries/theme", () => ({
  useTheme: () => ({ isDark: { value: true }, toggle: vi.fn() }),
}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: "/", component: { template: "<div/>" } },
    { path: "/dashboard", component: { template: "<div/>" } },
    { path: "/applications", component: { template: "<div/>" } },
  ],
});

describe("AppSidebar", () => {
  it("affiche le logo [d]", () => {
    const wrapper = mount(AppSidebar, {
      global: { plugins: [createPinia(), router] },
    });
    expect(wrapper.find(".app-sidebar__logo").text()).toContain("[d]");
  });

  it("contient un lien vers /dashboard", () => {
    const wrapper = mount(AppSidebar, {
      global: { plugins: [createPinia(), router] },
    });
    const dashboardLink = wrapper.find('[href="/dashboard"]');
    expect(dashboardLink.exists()).toBe(true);
  });

  it("contient un lien vers /applications", () => {
    const wrapper = mount(AppSidebar, {
      global: { plugins: [createPinia(), router] },
    });
    const appsLink = wrapper.find('[href="/applications"]');
    expect(appsLink.exists()).toBe(true);
  });

  it("affiche le bouton theme toggle", () => {
    const wrapper = mount(AppSidebar, {
      global: { plugins: [createPinia(), router] },
    });
    expect(wrapper.find(".app-sidebar__theme-btn").exists()).toBe(true);
  });

  it("n'affiche pas le bouton logout si non authentifié", () => {
    const wrapper = mount(AppSidebar, {
      global: { plugins: [createPinia(), router] },
    });
    expect(wrapper.find(".app-sidebar__logout-btn").exists()).toBe(false);
  });
});
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

```bash
cd frontend && npm run test:unit -- AppSidebar
```

Résultat attendu : FAIL — "Cannot find module './AppSidebar.vue'"

- [ ] **Step 3 : Créer `AppSidebar.vue`**

```vue
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
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils passent**

```bash
cd frontend && npm run test:unit -- AppSidebar
```

Résultat attendu : 5 tests passent.

- [ ] **Step 5 : Commit**

```bash
git add frontend/src/components/molecules/AppSidebar/
git commit -m "feat(DASH-10): add AppSidebar component with icon navigation and tooltips"
```

---

## Task 4 — Remplacer AppHeader par AppSidebar dans App.vue

**Files:**
- Modify: `frontend/src/App.vue`
- Delete: `frontend/src/components/molecules/AppHeader/AppHeader.vue`
- Delete: `frontend/src/components/molecules/AppHeader/AppHeader.spec.ts`

- [ ] **Step 1 : Mettre à jour `App.vue`**

Remplacer l'intégralité du fichier :

```vue
<script setup lang="ts">
import "@/assets/style/main.css";
import AppSidebar from "@/components/molecules/AppSidebar/AppSidebar.vue";
</script>

<template>
  <div class="app-layout gradient-bg">
    <AppSidebar />
    <main class="app-layout__content">
      <RouterView />
    </main>
  </div>
</template>

<style>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.app-layout__content {
  flex: 1;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}
</style>
```

- [ ] **Step 2 : Supprimer AppHeader**

```bash
rm frontend/src/components/molecules/AppHeader/AppHeader.vue
rm frontend/src/components/molecules/AppHeader/AppHeader.spec.ts
rmdir frontend/src/components/molecules/AppHeader
```

- [ ] **Step 3 : Lancer tous les tests frontend pour vérifier**

```bash
cd frontend && npm run test:unit
```

Résultat attendu : tous les tests passent (les tests AppHeader ont disparu avec le fichier).

- [ ] **Step 4 : Vérifier le build TypeScript**

```bash
cd frontend && npm run type-check
```

Résultat attendu : aucune erreur de type.

- [ ] **Step 5 : Commit**

```bash
git add frontend/src/App.vue
git rm frontend/src/components/molecules/AppHeader/AppHeader.vue \
        frontend/src/components/molecules/AppHeader/AppHeader.spec.ts
git commit -m "feat(DASH-10): replace AppHeader with AppSidebar, update global layout to flex"
```

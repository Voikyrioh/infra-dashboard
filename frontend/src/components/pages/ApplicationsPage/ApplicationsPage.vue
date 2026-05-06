<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAppsStore } from "@/stores/apps.store";
import AppRow from "@/components/molecules/AppRow/AppRow.vue";
import AppConfigModal from "@/components/molecules/AppConfigModal/AppConfigModal.vue";
import { fetchAppVersions, type App } from "@/services/apps.service";

const store = useAppsStore();
const modalOpen = ref(false);
const selectedApp = ref<App | null>(null);
const versionsMap = ref<Map<string, string[]>>(new Map());

async function loadVersions() {
  await Promise.all(
    store.apps
      .filter((a) => a.configured && a.imageName)
      .map(async (a) => {
        const versions = await fetchAppVersions(a.id);
        versionsMap.value = new Map(versionsMap.value).set(a.id, versions);
      }),
  );
}

onMounted(async () => {
  await store.loadApps();
  await store.loadTags();
  await loadVersions();
});

function openConfigure(app: App) {
  selectedApp.value = app;
  modalOpen.value = true;
}

async function handleSubmit(payload: any) {
  if (!selectedApp.value) return;
  await store.configure(selectedApp.value.id, payload);
}

async function handleAddTag(data: any) {
  await store.addTag(data);
}

async function handleDeploy(appId: string, version: string) {
  await store.deploy(appId, version);
  await loadVersions();
}
</script>

<template>
  <div class="applications-page">
    <div class="applications-page__header">
      <h1 class="applications-page__title neon-text-emerald font-display">
        Applications
      </h1>
      <button
        class="applications-page__sync-btn"
        :disabled="store.loading"
        @click="store.sync()"
      >
        ↻ Synchroniser
      </button>
    </div>

    <div class="applications-page__table">
      <div class="applications-page__table-header">
        <span>Application</span>
        <span>Type</span>
        <span>Tags</span>
        <span>Container</span>
        <span>Déploiement</span>
      </div>

      <div v-if="store.loading" class="applications-page__loading">
        Chargement…
      </div>

      <template v-else>
        <AppRow
          v-for="app in store.apps"
          :key="app.id"
          :app="app"
          :versions="versionsMap.get(app.id) ?? []"
          @configure="openConfigure(app)"
          @deploy="handleDeploy"
        />
        <div v-if="store.apps.length === 0" class="applications-page__empty">
          Aucune application. Clique sur Synchroniser pour détecter les apps GitHub.
        </div>
      </template>
    </div>

    <AppConfigModal
      v-if="selectedApp"
      v-model="modalOpen"
      :app="selectedApp"
      :tags="store.tags"
      @submit="handleSubmit"
      @add-tag="handleAddTag"
    />
  </div>
</template>

<style scoped>
.applications-page {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}
.applications-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.applications-page__title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}
.applications-page__sync-btn {
  background: rgba(52, 211, 153, 0.15);
  border: 1px solid rgba(52, 211, 153, 0.4);
  color: #34d399;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-family: var(--font-display);
  cursor: pointer;
  transition: background 0.15s;
}
.applications-page__sync-btn:hover {
  background: rgba(52, 211, 153, 0.25);
}
.applications-page__sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.applications-page__table {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.applications-page__table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 100px auto;
  gap: 12px;
  padding: 8px 12px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: var(--font-display);
}
.applications-page__loading,
.applications-page__empty {
  padding: 32px 12px;
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
}
</style>

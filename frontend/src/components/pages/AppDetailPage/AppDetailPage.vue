<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import GaugeCircle from "@/components/atoms/GaugeCircle/GaugeCircle.vue";
import VersionSelect from "@/components/atoms/VersionSelect/VersionSelect.vue";
import TagPill from "@/components/atoms/TagPill/TagPill.vue";
import { useAppsStore } from "@/stores/apps.store";
import { useToast } from "@/composables/useToast";
import {
  fetchApp,
  fetchAppStats,
  fetchAppInfraConfig,
  updateAppInfraConfig,
  fetchAppVersions,
  fetchAppLogs,
  configureApp,
  toggleAutoDeploy,
  type App,
  type AppStats,
  type InfraConfig,
  type LogLine,
} from "@/services/apps.service";

const route = useRoute();
const router = useRouter();
const store = useAppsStore();
const { add: addToast } = useToast();

const id = computed(() => route.params.id as string);

const app = ref<App | null>(null);
const stats = ref<AppStats | null>(null);
const infraConfig = ref<InfraConfig | null>(null);
const versions = ref<string[]>([]);
const logs = ref<LogLine[]>([]);
const logSource = ref<"loki" | "file">("loki");
const logSearch = ref("");
const autoRefreshLogs = ref(false);
let logRefreshInterval: ReturnType<typeof setInterval> | null = null;

const loading = ref(true);
const deploying = ref(false);
const savingConfig = ref(false);
const savingEnv = ref(false);

// Config editor state
const editDisplayName = ref("");
const editType = ref<"frontend" | "backend" | "fullstack" | null>(null);
const editContainerName = ref("");
const editTagIds = ref<string[]>([]);

// Env vars editor state
const editEnv = ref<Record<string, string>>({});
const newEnvKey = ref("");
const newEnvValue = ref("");

interface ParsedLog {
  timestamp: string;
  level: string;
  levelNum: number;
  message: string;
  extra: string | null;
}

function parsePinoLog(line: LogLine): ParsedLog {
  try {
    const obj = JSON.parse(line.message);
    if (typeof obj === "object" && obj !== null && "msg" in obj) {
      const { level = 30, time, msg, pid: _pid, hostname: _host, ...rest } = obj as Record<string, unknown>;
      const levelNum = Number(level);
      const levelName =
        levelNum >= 60 ? "FATAL" :
        levelNum >= 50 ? "ERROR" :
        levelNum >= 40 ? "WARN" :
        levelNum >= 20 ? "DEBUG" : "INFO";
      const ts = time ? new Date(Number(time)).toISOString() : line.timestamp;
      const errObj = rest.err as Record<string, unknown> | undefined;
      const stack = errObj?.stack ? String(errObj.stack) : null;
      const fullMessage = stack && !String(msg).includes(stack)
        ? `${String(msg)}\n${stack}`
        : String(msg);
      return { timestamp: ts, level: levelName, levelNum, message: fullMessage, extra: null };
    }
  } catch {}
  return { timestamp: line.timestamp, level: "INFO", levelNum: 30, message: line.message, extra: null };
}

const filteredLogs = computed(() => {
  const lines = logSearch.value
    ? logs.value.filter((l) => l.message.toLowerCase().includes(logSearch.value.toLowerCase()))
    : logs.value;
  return lines.map(parsePinoLog);
});

const statusDot: Record<string, string> = {
  running: "#34d399",
  stopped: "#6b7280",
  unknown: "#6b7280",
};

function statusLabel(s: string | null) {
  if (!s) return "—";
  return s === "running" ? "Running" : s === "stopped" ? "Stopped" : "Unknown";
}

function initConfigEditor(a: App) {
  editDisplayName.value = a.displayName ?? "";
  editType.value = a.type;
  editContainerName.value = a.containerName ?? "";
  editTagIds.value = a.tags.map((t) => t.id);
}

async function loadLogs() {
  if (!app.value) return;
  logs.value = await fetchAppLogs(id.value, logSource.value);
}

async function saveConfig() {
  if (!editType.value || !app.value) return;
  savingConfig.value = true;
  try {
    const updated = await configureApp(id.value, {
      displayName: editDisplayName.value,
      type: editType.value,
      containerName: editContainerName.value,
      tagIds: editTagIds.value,
    });
    app.value = { ...app.value, ...updated };
    addToast("Configuration sauvegardée.", "success");
  } catch {
    addToast("Erreur lors de la sauvegarde.", "error");
  } finally {
    savingConfig.value = false;
  }
}

async function saveEnv() {
  if (!infraConfig.value) return;
  savingEnv.value = true;
  try {
    await updateAppInfraConfig(id.value, editEnv.value);
    addToast("Variables d'environnement commitées sur GitHub.", "success");
  } catch {
    addToast("Erreur lors du commit.", "error");
  } finally {
    savingEnv.value = false;
  }
}

function addEnvVar() {
  if (!newEnvKey.value.trim()) return;
  editEnv.value = { ...editEnv.value, [newEnvKey.value.trim()]: newEnvValue.value };
  newEnvKey.value = "";
  newEnvValue.value = "";
}

function removeEnvVar(key: string) {
  const next = { ...editEnv.value };
  delete next[key];
  editEnv.value = next;
}

async function handleDeploy(version: string) {
  deploying.value = true;
  try {
    await store.deploy(id.value, version);
    addToast(`Déploiement de ${version} déclenché.`, "success");
    const refreshed = await fetchApp(id.value);
    app.value = refreshed;
  } catch {
    addToast("Échec du déploiement.", "error");
  } finally {
    deploying.value = false;
  }
}

async function handleToggleAutoDeploy() {
  if (!app.value) return;
  const newVal = !app.value.autoDeployEnabled;
  try {
    await toggleAutoDeploy(id.value, newVal);
    app.value.autoDeployEnabled = newVal;
    addToast(`Auto-deploy ${newVal ? "activé" : "désactivé"}.`, "success");
  } catch {
    addToast("Erreur lors du changement de mode.", "error");
  }
}

function toggleTag(tagId: string) {
  const idx = editTagIds.value.indexOf(tagId);
  if (idx === -1) editTagIds.value.push(tagId);
  else editTagIds.value.splice(idx, 1);
}

function toggleAutoRefreshLogs() {
  autoRefreshLogs.value = !autoRefreshLogs.value;
  if (autoRefreshLogs.value) {
    logRefreshInterval = setInterval(loadLogs, 5000);
  } else {
    if (logRefreshInterval) clearInterval(logRefreshInterval);
  }
}

async function switchLogSource(src: "loki" | "file") {
  logSource.value = src;
  await loadLogs();
}

onUnmounted(() => {
  if (logRefreshInterval) clearInterval(logRefreshInterval);
});

onMounted(async () => {
  loading.value = true;
  try {
    await store.loadTags();
    const [appData, statsData, infraData, versionsData, logsData] = await Promise.all([
      fetchApp(id.value),
      fetchAppStats(id.value),
      fetchAppInfraConfig(id.value).catch(() => null),
      fetchAppVersions(id.value),
      fetchAppLogs(id.value),
    ]);
    app.value = appData;
    stats.value = statsData;
    infraConfig.value = infraData;
    versions.value = versionsData;
    logs.value = logsData;

    if (infraData) {
      editEnv.value = { ...infraData.env };
    }

    initConfigEditor(appData);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="detail-page">
    <div class="detail-page__back" @click="router.push('/applications')">
      ← Applications
    </div>

    <div v-if="loading" class="detail-page__loading">Chargement…</div>

    <template v-else-if="app">
      <!-- Header -->
      <div class="detail-page__header">
        <div class="detail-page__title-block">
          <h1 class="detail-page__title neon-text-emerald font-display">
            {{ app.displayName ?? app.repoName }}
          </h1>
          <a :href="app.repoUrl" target="_blank" class="detail-page__repo">
            {{ app.repoUrl.replace("https://github.com/", "") }}
          </a>
        </div>
        <div class="detail-page__status" v-if="app.containerStatus">
          <span
            class="detail-page__dot"
            :style="{ background: statusDot[app.containerStatus] }"
          />
          <span class="detail-page__status-label">{{ statusLabel(app.containerStatus) }}</span>
        </div>
      </div>

      <!-- Top grid: Stats + Config -->
      <div class="detail-page__top-grid">
        <!-- Stats -->
        <div class="glass-card detail-page__card">
          <div class="detail-page__card-title">Ressources</div>
          <div v-if="stats" class="detail-page__stats-grid">
            <div class="detail-page__gauge-block">
              <GaugeCircle :value="stats.cpuPercent" label="CPU" />
              <span class="detail-page__gauge-label">{{ stats.cpuPercent }}%</span>
            </div>
            <div class="detail-page__gauge-block">
              <GaugeCircle :value="stats.memPercent" label="RAM" />
              <span class="detail-page__gauge-label">
                {{ stats.memUsageMb }} / {{ stats.memLimitMb }} Mo
              </span>
            </div>
          </div>
          <div v-else class="detail-page__empty-text">Container non joignable</div>
        </div>

        <!-- Config -->
        <div class="glass-card detail-page__card">
          <div class="detail-page__card-title">Configuration</div>

          <label class="detail-page__label">Nom affiché</label>
          <input v-model="editDisplayName" class="detail-page__input" />

          <label class="detail-page__label">Type</label>
          <div class="detail-page__type-group">
            <button
              v-for="t in ['frontend', 'backend', 'fullstack']"
              :key="t"
              class="detail-page__type-btn"
              :class="{ 'detail-page__type-btn--active': editType === t }"
              @click="editType = t as 'frontend' | 'backend' | 'fullstack'"
            >{{ t }}</button>
          </div>

          <label class="detail-page__label">Nom du container Docker</label>
          <input v-model="editContainerName" class="detail-page__input" placeholder="ex: my-app" />

          <label class="detail-page__label">Tags</label>
          <div class="detail-page__tags">
            <TagPill
              v-for="tag in store.tags"
              :key="tag.id"
              :label="tag.label"
              :color="tag.color"
              :selectable="true"
              :selected="editTagIds.includes(tag.id)"
              @toggle="toggleTag(tag.id)"
            />
          </div>

          <div class="detail-page__auto-deploy-row">
            <span class="detail-page__label" style="margin:0">Auto-deploy</span>
            <button
              class="detail-page__toggle"
              :class="{ 'detail-page__toggle--on': app.autoDeployEnabled }"
              @click="handleToggleAutoDeploy"
            >{{ app.autoDeployEnabled ? 'ON' : 'OFF' }}</button>
          </div>
          <p v-if="app.autoDeployEnabled" class="detail-page__hint">
            Se redéploie automatiquement à chaque nouvelle release GitHub.
          </p>

          <button
            class="detail-page__save-btn"
            :disabled="savingConfig"
            @click="saveConfig"
          >{{ savingConfig ? 'Sauvegarde…' : 'Sauvegarder' }}</button>
        </div>
      </div>

      <!-- Env vars -->
      <div v-if="infraConfig" class="glass-card detail-page__card detail-page__card--full">
        <div class="detail-page__card-title">Variables d'environnement (infra)</div>
        <div class="detail-page__env-list">
          <div v-for="(val, key) in editEnv" :key="key" class="detail-page__env-row">
            <span class="detail-page__env-key font-display">{{ key }}</span>
            <input v-model="editEnv[key]" class="detail-page__env-val" />
            <button class="detail-page__env-remove" @click="removeEnvVar(key)">✕</button>
          </div>
        </div>
        <div class="detail-page__env-add">
          <input v-model="newEnvKey" class="detail-page__env-new-key" placeholder="CLE" />
          <input v-model="newEnvValue" class="detail-page__env-new-val" placeholder="valeur" />
          <button class="detail-page__env-add-btn" @click="addEnvVar">+ Ajouter</button>
        </div>
        <button
          class="detail-page__save-btn"
          :disabled="savingEnv"
          @click="saveEnv"
        >{{ savingEnv ? 'Commit en cours…' : '↑ Committer sur GitHub' }}</button>
      </div>
      <div v-else-if="app.appName" class="glass-card detail-page__card detail-page__card--full">
        <div class="detail-page__card-title">Variables d'environnement (infra)</div>
        <div class="detail-page__empty-text">Impossible de charger la config infra.</div>
      </div>

      <!-- Versions -->
      <div class="glass-card detail-page__card detail-page__card--full">
        <div class="detail-page__card-title">Versions</div>
        <div class="detail-page__versions-row">
          <VersionSelect
            :versions="versions"
            :deployed-version="app.deployedVersion"
            :disabled="versions.length === 0"
            :loading="deploying"
            @deploy="handleDeploy"
          />
          <span v-if="versions.length === 0" class="detail-page__empty-text">
            Aucune version disponible
          </span>
        </div>
      </div>

      <!-- Logs -->
      <div class="glass-card detail-page__card detail-page__card--full">
        <div class="detail-page__logs-header">
          <div class="detail-page__card-title">Logs</div>
          <div class="detail-page__logs-controls">
            <button
              class="detail-page__log-tab"
              :class="{ 'detail-page__log-tab--active': logSource === 'loki' }"
              @click="switchLogSource('loki')"
            >Stdout</button>
            <button
              v-if="infraConfig?.logFile"
              class="detail-page__log-tab"
              :class="{ 'detail-page__log-tab--active': logSource === 'file' }"
              @click="switchLogSource('file')"
            >Fichier</button>
            <button
              class="detail-page__log-refresh"
              :class="{ 'detail-page__log-refresh--active': autoRefreshLogs }"
              @click="toggleAutoRefreshLogs"
            >⟳ Auto</button>
            <input
              v-model="logSearch"
              class="detail-page__log-search"
              placeholder="Rechercher…"
            />
          </div>
        </div>

        <div class="detail-page__logs-viewer">
          <div
            v-for="(line, i) in filteredLogs"
            :key="i"
            class="detail-page__log-line"
            :class="`detail-page__log-line--${line.level.toLowerCase()}`"
          >
            <span class="detail-page__log-ts font-display">{{ line.timestamp.replace('T', ' ').slice(0, 19) }}</span>
            <span class="detail-page__log-level font-display" :class="`detail-page__log-level--${line.level.toLowerCase()}`">{{ line.level }}</span>
            <span class="detail-page__log-msg" :class="{ 'detail-page__log-msg--stack': line.levelNum >= 50 }">{{ line.message }}</span>
          </div>
          <div v-if="filteredLogs.length === 0" class="detail-page__empty-text">
            {{ logSearch ? 'Aucun résultat.' : 'Aucun log disponible.' }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.detail-page__back {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  font-family: var(--font-display);
  width: fit-content;
  transition: color 0.15s;
}
.detail-page__back:hover { color: rgba(255, 255, 255, 0.7); }
.detail-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 8px;
}
.detail-page__title-block { display: flex; flex-direction: column; gap: 4px; }
.detail-page__title { font-size: 24px; font-weight: 700; margin: 0; }
.detail-page__repo {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  text-decoration: none;
  font-family: var(--font-display);
}
.detail-page__repo:hover { color: rgba(255, 255, 255, 0.6); }
.detail-page__status { display: flex; align-items: center; gap: 6px; }
.detail-page__dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.detail-page__status-label { font-size: 12px; color: rgba(255, 255, 255, 0.5); }
.detail-page__top-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
}
.detail-page__card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-page__card--full { width: 100%; box-sizing: border-box; }
.detail-page__card-title {
  font-family: var(--font-display);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 4px;
}
.detail-page__stats-grid {
  display: flex;
  gap: 32px;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
}
.detail-page__gauge-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.detail-page__gauge-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  font-family: var(--font-display);
}
.detail-page__label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: -6px;
}
.detail-page__input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 7px;
  padding: 8px 12px;
  font-size: 13px;
  color: #f1f5f9;
  font-family: var(--font-display);
  width: 100%;
  box-sizing: border-box;
  outline: none;
}
.detail-page__input:focus { border-color: rgba(52, 211, 153, 0.4); }
.detail-page__type-group { display: flex; gap: 6px; }
.detail-page__type-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 7px;
  padding: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  transition: all 0.15s;
}
.detail-page__type-btn--active {
  background: rgba(52, 211, 153, 0.15);
  border-color: rgba(52, 211, 153, 0.4);
  color: #34d399;
}
.detail-page__tags { display: flex; flex-wrap: wrap; gap: 5px; }
.detail-page__auto-deploy-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}
.detail-page__toggle {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 3px 14px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--font-display);
}
.detail-page__toggle--on {
  background: rgba(52, 211, 153, 0.2);
  border-color: rgba(52, 211, 153, 0.5);
  color: #34d399;
}
.detail-page__hint {
  font-size: 11px;
  color: rgba(52, 211, 153, 0.6);
  margin: -4px 0;
}
.detail-page__save-btn {
  background: rgba(52, 211, 153, 0.15);
  border: 1px solid rgba(52, 211, 153, 0.4);
  color: #34d399;
  padding: 8px 16px;
  border-radius: 7px;
  font-size: 12px;
  cursor: pointer;
  align-self: flex-end;
  font-family: var(--font-display);
  transition: background 0.15s;
}
.detail-page__save-btn:hover { background: rgba(52, 211, 153, 0.25); }
.detail-page__save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.detail-page__env-list { display: flex; flex-direction: column; gap: 6px; }
.detail-page__env-row {
  display: grid;
  grid-template-columns: 180px 1fr 28px;
  gap: 8px;
  align-items: center;
}
.detail-page__env-key {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  word-break: break-all;
}
.detail-page__env-val {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 12px;
  color: #f1f5f9;
  font-family: var(--font-display);
  outline: none;
  width: 100%;
  box-sizing: border-box;
}
.detail-page__env-val:focus { border-color: rgba(52, 211, 153, 0.35); }
.detail-page__env-remove {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}
.detail-page__env-remove:hover { color: rgba(239, 68, 68, 0.7); }
.detail-page__env-add {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
.detail-page__env-new-key {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 11px;
  color: #f1f5f9;
  font-family: var(--font-display);
  width: 140px;
  outline: none;
  text-transform: uppercase;
}
.detail-page__env-new-val {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  color: #f1f5f9;
  font-family: var(--font-display);
  outline: none;
}
.detail-page__env-add-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.5);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
}
.detail-page__versions-row { display: flex; align-items: center; gap: 16px; }
.detail-page__logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.detail-page__logs-controls { display: flex; align-items: center; gap: 8px; }
.detail-page__log-tab {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.35);
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 11px;
  cursor: pointer;
  font-family: var(--font-display);
  transition: all 0.15s;
}
.detail-page__log-tab--active {
  background: rgba(52, 211, 153, 0.15);
  border-color: rgba(52, 211, 153, 0.4);
  color: #34d399;
}
.detail-page__log-refresh {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}
.detail-page__log-refresh--active {
  border-color: rgba(52, 211, 153, 0.4);
  color: #34d399;
}
.detail-page__log-search {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  color: #f1f5f9;
  outline: none;
  width: 160px;
}
.detail-page__logs-viewer {
  font-family: var(--font-display);
  font-size: 11px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.detail-page__log-line { display: flex; gap: 10px; align-items: baseline; }
.detail-page__log-ts { color: rgba(255, 255, 255, 0.25); white-space: nowrap; font-size: 10px; flex-shrink: 0; }
.detail-page__log-level {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  white-space: nowrap;
  flex-shrink: 0;
  width: 36px;
  text-align: center;
}
.detail-page__log-level--info  { color: rgba(52, 211, 153, 0.7); }
.detail-page__log-level--warn  { color: rgba(251, 191, 36, 0.85); }
.detail-page__log-level--error { color: rgba(239, 68, 68, 0.9); }
.detail-page__log-level--fatal { color: rgba(168, 85, 247, 0.9); }
.detail-page__log-level--debug { color: rgba(96, 165, 250, 0.6); }
.detail-page__log-level--trace { color: rgba(255, 255, 255, 0.2); }
.detail-page__log-msg { color: rgba(255, 255, 255, 0.7); word-break: break-word; flex: 1; }
.detail-page__log-line--error .detail-page__log-msg { color: rgba(252, 165, 165, 0.85); }
.detail-page__log-line--warn  .detail-page__log-msg { color: rgba(253, 224, 71, 0.75); }
.detail-page__log-msg--stack { white-space: pre-wrap; font-size: 10px; }
.detail-page__empty-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.25);
  text-align: center;
  padding: 16px 0;
}
.detail-page__loading {
  text-align: center;
  padding: 80px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 13px;
}
</style>

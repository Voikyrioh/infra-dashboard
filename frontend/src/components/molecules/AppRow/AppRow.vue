<script setup lang="ts">
import TagPill from "@/components/atoms/TagPill/TagPill.vue";
import type { App } from "@/services/apps.service";

const props = defineProps<{ app: App }>();
const emit = defineEmits<{ configure: [] }>();

const typeColors: Record<string, string> = {
  frontend: "rgba(52,211,153,0.15)",
  backend: "rgba(139,92,246,0.15)",
  fullstack: "rgba(52,211,153,0.15)",
};
const typeTextColors: Record<string, string> = {
  frontend: "#34d399",
  backend: "#a78bfa",
  fullstack: "#34d399",
};

const statusDot: Record<string, string> = {
  success: "#34d399",
  running: "#34d399",
  failure: "#ef4444",
  stopped: "#6b7280",
  unknown: "#6b7280",
  cancelled: "#f59e0b",
  timed_out: "#ef4444",
  in_progress: "#60a5fa",
};

function handleClick() {
  if (!props.app.configured) emit("configure");
}
</script>

<template>
  <div
    class="app-row"
    :class="{ 'app-row--unconfigured': !app.configured }"
    @click="handleClick"
  >
    <!-- Application -->
    <div class="app-row__name">
      <span class="app-row__display">
        {{ app.displayName ?? app.repoName }}
      </span>
      <a
        :href="app.repoUrl"
        target="_blank"
        rel="noopener"
        class="app-row__repo"
        @click.stop
      >
        {{ app.repoUrl.replace("https://github.com/", "") }}
      </a>
    </div>

    <!-- Type -->
    <div class="app-row__type">
      <span
        v-if="app.type"
        class="app-row__badge"
        :style="{
          background: typeColors[app.type],
          color: typeTextColors[app.type],
        }"
      >
        {{ app.type }}
      </span>
      <span v-else class="app-row__dash">—</span>
    </div>

    <!-- Tags -->
    <div class="app-row__tags">
      <span v-if="!app.configured" class="app-row__unconfigured-badge">
        ⚙ À configurer
      </span>
      <template v-else>
        <TagPill
          v-for="tag in app.tags"
          :key="tag.id"
          :label="tag.label"
          :color="tag.color"
        />
        <span v-if="app.tags.length === 0" class="app-row__dash">—</span>
      </template>
    </div>

    <!-- Deploy -->
    <div class="app-row__status">
      <template v-if="app.deployStatus">
        <span
          class="app-row__dot"
          :style="{ background: statusDot[app.deployStatus.conclusion ?? 'unknown'] }"
        />
        <span class="app-row__status-label">
          {{ app.deployStatus.conclusion === 'success' ? 'OK' : app.deployStatus.conclusion === 'failure' ? 'KO' : app.deployStatus.conclusion }}
        </span>
      </template>
      <span v-else class="app-row__dash">—</span>
    </div>

    <!-- Container -->
    <div class="app-row__status">
      <template v-if="app.containerStatus">
        <span
          class="app-row__dot"
          :style="{ background: statusDot[app.containerStatus] }"
        />
        <span class="app-row__status-label">
          {{ app.containerStatus === 'running' ? 'Running' : app.containerStatus === 'stopped' ? 'Stopped' : 'Unknown' }}
        </span>
      </template>
      <span v-else class="app-row__dash">—</span>
    </div>
  </div>
</template>

<style scoped>
.app-row {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 100px 100px;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  align-items: center;
  transition: background 0.15s;
}
.app-row--unconfigured {
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(245, 158, 11, 0.3);
  cursor: pointer;
}
.app-row--unconfigured:hover {
  background: rgba(245, 158, 11, 0.05);
}
.app-row__name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.app-row__display {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
}
.app-row--unconfigured .app-row__display {
  color: rgba(255, 255, 255, 0.4);
}
.app-row__repo {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  text-decoration: none;
  font-family: var(--font-display);
}
.app-row__repo:hover {
  color: rgba(255, 255, 255, 0.6);
}
.app-row__badge {
  display: inline-block;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: var(--font-display);
}
.app-row__unconfigured-badge {
  font-size: 11px;
  color: #fbbf24;
}
.app-row__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
.app-row__status {
  display: flex;
  align-items: center;
  gap: 5px;
}
.app-row__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.app-row__status-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}
.app-row__dash {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.2);
}
</style>

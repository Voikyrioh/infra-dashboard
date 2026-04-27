<script setup lang="ts">
import type { TopApp } from "@/services/metrics.service";

defineProps<{
  total24h: number | null;
  topApps: TopApp[];
}>();
</script>

<template>
  <div class="visits-panel glass-card">
    <div class="visits-panel__section">
      <p class="visits-panel__label font-display">Visites 24h</p>
      <p class="visits-panel__total neon-text-emerald font-display">
        {{ total24h !== null ? total24h.toLocaleString() : "—" }}
      </p>
    </div>

    <div class="visits-panel__divider" />

    <div class="visits-panel__section">
      <p class="visits-panel__label font-display">Top apps</p>
      <div v-if="topApps.length" class="visits-panel__apps">
        <div
          v-for="app in topApps"
          :key="app.name"
          class="visits-panel__app-row"
        >
          <span class="visits-panel__app-name">{{ app.name }}</span>
          <span class="visits-panel__app-count">{{ app.visits.toLocaleString() }}</span>
        </div>
      </div>
      <p v-else class="visits-panel__empty">Données indisponibles</p>
    </div>
  </div>
</template>

<style scoped>
.visits-panel {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.visits-panel__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.visits-panel__label {
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin: 0;
}

.visits-panel__total {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  line-height: 1;
}

.visits-panel__divider {
  height: 1px;
  background: var(--color-border);
}

.visits-panel__apps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.visits-panel__app-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.visits-panel__app-name {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-family: var(--font-display);
}

.visits-panel__app-count {
  font-size: 0.875rem;
  color: var(--color-navy-light);
  font-weight: 600;
}

.visits-panel__empty {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 0;
}
</style>

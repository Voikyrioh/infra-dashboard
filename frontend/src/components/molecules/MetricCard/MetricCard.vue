<script setup lang="ts">
import GaugeCircle from "@/components/atoms/GaugeCircle/GaugeCircle.vue";
import type { SseStatus } from "@/stores/metrics.store";

defineProps<{
  title: string;
  value: number;
  sublabel: string;
  status?: SseStatus;
}>();
</script>

<template>
  <div class="metric-card glass-card">
    <div class="metric-card__header">
      <span class="metric-card__title font-display">{{ title }}</span>
      <span
        v-if="status && status !== 'connected'"
        class="metric-card__status"
        :class="`metric-card__status--${status}`"
      >
        {{ status === "reconnecting" ? "Reconnexion" : status === "connecting" ? "Connexion..." : "Erreur" }}
      </span>
      <span v-else class="metric-card__dot" />
    </div>
    <GaugeCircle :value="value" :label="title" :sublabel="sublabel" />
  </div>
</template>

<style scoped>
.metric-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.metric-card__header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-card__title {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.metric-card__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-emerald);
  animation: pulse-neon 2s ease-in-out infinite;
}

.metric-card__status {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 999px;
}

.metric-card__status--reconnecting,
.metric-card__status--connecting {
  background: var(--color-amber-dim);
  color: var(--color-amber);
}

.metric-card__status--error {
  background: var(--color-error-dim);
  color: var(--color-error);
}
</style>

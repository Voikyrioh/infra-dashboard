<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import LineChart from "@/components/atoms/LineChart/LineChart.vue";
import MetricCard from "@/components/molecules/MetricCard/MetricCard.vue";
import VisitsPanel from "@/components/molecules/VisitsPanel/VisitsPanel.vue";
import {
  connectLive,
  fetchHistory,
  fetchVisits,
  type HistoryRange,
} from "@/services/metrics.service";
import { useMetricsStore } from "@/stores/metrics.store";

const store = useMetricsStore();
const historyLoading = ref(false);
let disconnectLive: (() => void) | null = null;

async function loadHistory(range: HistoryRange) {
  historyLoading.value = true;
  const data = await fetchHistory(range);
  store.setHistory(range, data);
  historyLoading.value = false;
}

onMounted(async () => {
  disconnectLive = connectLive(
    (metrics) => store.setLive(metrics),
    (status) => store.setSseStatus(status),
  );
  const [, visits] = await Promise.all([
    loadHistory("1h"),
    fetchVisits(),
  ]);
  store.setVisits(visits);
});

onUnmounted(() => {
  disconnectLive?.();
});
</script>

<template>
  <div class="dashboard-page">
    <div class="dashboard-page__inner">
      <div class="dashboard-page__grid">
        <!-- Colonne gauche : métriques live -->
        <div class="dashboard-page__metrics">
          <MetricCard
            title="CPU"
            :value="store.cpu"
            sublabel="utilisation"
            :status="store.sseStatus"
          />
          <MetricCard
            title="RAM"
            :value="store.ramTotal > 0 ? Math.round((store.ramUsed / store.ramTotal) * 100) : 0"
            :sublabel="`${store.ramUsed} / ${store.ramTotal} MB`"
            :status="store.sseStatus"
          />
        </div>

        <!-- Colonne droite : visites -->
        <VisitsPanel
          :total24h="store.total24h"
          :top-apps="store.topApps"
        />
      </div>

      <!-- Graphe historique pleine largeur -->
      <div class="dashboard-page__history glass-card">
        <div class="dashboard-page__history-header">
          <span class="dashboard-page__history-title font-display">Historique</span>
          <div class="dashboard-page__range-btns">
            <button
              v-for="r in (['1h', '24h', '7d'] as HistoryRange[])"
              :key="r"
              class="dashboard-page__range-btn"
              :class="{ 'dashboard-page__range-btn--active': store.historyRange === r }"
              @click="loadHistory(r)"
            >
              {{ r }}
            </button>
          </div>
        </div>
        <LineChart
          :cpu-data="store.historyCpu"
          :ram-data="store.historyRam"
          :loading="historyLoading"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  min-height: calc(100vh - 56px);
  padding: 32px 24px;
}

.dashboard-page__inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-page__grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 16px;
}

.dashboard-page__metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dashboard-page__history {
  padding: 20px;
}

.dashboard-page__history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.dashboard-page__history-title {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.dashboard-page__range-btns {
  display: flex;
  gap: 4px;
}

.dashboard-page__range-btn {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-display);
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.dashboard-page__range-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.dashboard-page__range-btn--active {
  background: var(--color-emerald-dim);
  border-color: var(--color-border-accent);
  color: var(--color-emerald);
}

@media (max-width: 640px) {
  .dashboard-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>

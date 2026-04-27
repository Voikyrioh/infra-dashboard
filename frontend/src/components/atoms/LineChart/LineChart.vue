<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  Filler,
} from "chart.js";
import type { DataPoint } from "@/services/metrics.service";

Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Filler);

const props = defineProps<{
  cpuData: DataPoint[];
  ramData: DataPoint[];
  loading?: boolean;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

function buildDatasets() {
  return {
    datasets: [
      {
        label: "CPU %",
        data: props.cpuData.map((p) => ({ x: p.t * 1000, y: p.v })),
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.1)",
        borderWidth: 1.5,
        pointRadius: 0,
        fill: true,
        tension: 0.3,
      },
      {
        label: "RAM MB",
        data: props.ramData.map((p) => ({ x: p.t * 1000, y: p.v })),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.08)",
        borderWidth: 1.5,
        pointRadius: 0,
        fill: true,
        tension: 0.3,
        yAxisID: "y2",
      },
    ],
  };
}

onMounted(() => {
  if (!canvasRef.value) return;
  chart = new Chart(canvasRef.value, {
    type: "line",
    data: { datasets: buildDatasets().datasets },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "linear",
          ticks: { color: "#484f58", maxTicksLimit: 6, callback: (v) => new Date(Number(v)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
          grid: { color: "rgba(48,54,61,0.4)" },
        },
        y: {
          position: "left",
          ticks: { color: "#10b981", callback: (v) => `${v}%` },
          grid: { color: "rgba(48,54,61,0.4)" },
        },
        y2: {
          position: "right",
          ticks: { color: "#3b82f6", callback: (v) => `${v}M` },
          grid: { drawOnChartArea: false },
        },
      },
      plugins: {
        legend: { labels: { color: "#8b949e", boxWidth: 12, font: { size: 11 } } },
        tooltip: { mode: "index", intersect: false },
      },
    },
  });
});

watch([() => props.cpuData, () => props.ramData], () => {
  if (!chart) return;
  const ds = buildDatasets().datasets;
  const d0 = chart.data.datasets[0];
  const d1 = chart.data.datasets[1];
  if (d0) d0.data = ds[0]?.data ?? [];
  if (d1) d1.data = ds[1]?.data ?? [];
  chart.update("none");
});

onUnmounted(() => {
  chart?.destroy();
});
</script>

<template>
  <div class="line-chart">
    <div v-if="loading" class="line-chart__loading">
      <div class="line-chart__spinner" />
    </div>
    <canvas v-else ref="canvasRef" />
  </div>
</template>

<style scoped>
.line-chart {
  position: relative;
  height: 200px;
  width: 100%;
}

.line-chart__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.line-chart__spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-emerald);
  border-radius: 50%;
  animation: spin-slow 0.8s linear infinite;
}
</style>

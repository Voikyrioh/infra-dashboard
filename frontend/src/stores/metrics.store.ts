import { defineStore } from "pinia";
import { ref } from "vue";
import type { DataPoint, HistoryRange, TopApp } from "@/services/metrics.service";

export type SseStatus = "connecting" | "connected" | "reconnecting" | "error";

export const useMetricsStore = defineStore("metrics", () => {
  const cpu = ref<number>(0);
  const ramUsed = ref<number>(0);
  const ramTotal = ref<number>(0);
  const sseStatus = ref<SseStatus>("connecting");

  const historyCpu = ref<DataPoint[]>([]);
  const historyRam = ref<DataPoint[]>([]);
  const historyRange = ref<HistoryRange>("1h");

  const total24h = ref<number | null>(null);
  const topApps = ref<TopApp[]>([]);

  function setLive(metrics: { cpu: number; ram: { used: number; total: number } }) {
    cpu.value = metrics.cpu;
    ramUsed.value = metrics.ram.used;
    ramTotal.value = metrics.ram.total;
  }

  function setSseStatus(status: SseStatus) {
    sseStatus.value = status;
  }

  function setHistory(range: HistoryRange, data: { cpu: DataPoint[]; ram: DataPoint[] }) {
    historyRange.value = range;
    historyCpu.value = data.cpu;
    historyRam.value = data.ram;
  }

  function setVisits(data: { total24h: number | null; topApps: TopApp[] }) {
    total24h.value = data.total24h;
    topApps.value = data.topApps;
  }

  return {
    cpu,
    ramUsed,
    ramTotal,
    sseStatus,
    historyCpu,
    historyRam,
    historyRange,
    total24h,
    topApps,
    setLive,
    setSseStatus,
    setHistory,
    setVisits,
  };
});

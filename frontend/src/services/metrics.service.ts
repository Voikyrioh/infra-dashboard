import { handle401 } from "./auth.service";

export interface LiveMetrics {
  cpu: number;
  ram: { used: number; total: number };
}

export interface DataPoint {
  t: number;
  v: number;
}

export interface HistoryMetrics {
  cpu: DataPoint[];
  ram: DataPoint[];
}

export interface TopApp {
  name: string;
  visits: number;
}

export interface VisitsData {
  total24h: number | null;
  topApps: TopApp[];
}

export type HistoryRange = "1h" | "24h" | "7d";

export function connectLive(
  onData: (metrics: LiveMetrics) => void,
  onStatusChange: (status: "connected" | "reconnecting" | "error") => void,
): () => void {
  let es: EventSource | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;
  let backoff = 1000;

  function connect() {
    if (destroyed) return;
    es = new EventSource("/api/v1/metrics/live");

    es.onmessage = (event) => {
      backoff = 1000;
      const data = JSON.parse(event.data);
      if (data.error) {
        onStatusChange("error");
      } else {
        onStatusChange("connected");
        onData(data as LiveMetrics);
      }
    };

    es.onerror = () => {
      es?.close();
      es = null;
      if (!destroyed) {
        onStatusChange("reconnecting");
        timeout = setTimeout(() => {
          backoff = Math.min(backoff * 2, 30000);
          connect();
        }, backoff);
      }
    };
  }

  connect();

  return () => {
    destroyed = true;
    if (timeout) clearTimeout(timeout);
    es?.close();
  };
}

export async function fetchHistory(range: HistoryRange): Promise<HistoryMetrics> {
  const res = await fetch(`/api/v1/metrics/history?range=${range}`);
  if (res.status === 401) {
    handle401();
    throw new Error("Unauthorized");
  }
  if (!res.ok) return { cpu: [], ram: [] };
  return res.json();
}

export async function fetchVisits(): Promise<VisitsData> {
  const res = await fetch("/api/v1/visits");
  if (res.status === 401) {
    handle401();
    throw new Error("Unauthorized");
  }
  if (!res.ok) return { total24h: null, topApps: [] };
  return res.json();
}

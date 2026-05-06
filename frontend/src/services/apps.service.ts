import { handle401 } from "./auth.service";

export interface PredefinedTag {
  id: string;
  category: string;
  label: string;
  color: string;
}

export interface App {
  id: string;
  repoName: string;
  repoUrl: string;
  displayName: string | null;
  type: "frontend" | "backend" | "fullstack" | null;
  containerName: string | null;
  configured: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  tags: PredefinedTag[];
  containerStatus: "running" | "stopped" | "unknown" | null;
  appName: string | null;
  imageName: string | null;
  deployedVersion: string | null;
}

export interface ConfigureAppPayload {
  displayName: string;
  type: "frontend" | "backend" | "fullstack";
  containerName: string;
  tagIds: string[];
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    handle401();
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export async function syncApps(): Promise<App[]> {
  const res = await fetch("/api/v1/apps/sync", { method: "POST" });
  return handleResponse<App[]>(res);
}

export async function fetchApps(): Promise<App[]> {
  const res = await fetch("/api/v1/apps");
  return handleResponse<App[]>(res);
}

export async function configureApp(
  id: string,
  payload: ConfigureAppPayload,
): Promise<App> {
  const res = await fetch(`/api/v1/apps/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<App>(res);
}

export async function fetchTags(): Promise<PredefinedTag[]> {
  const res = await fetch("/api/v1/tags");
  return handleResponse<PredefinedTag[]>(res);
}

export async function createTag(
  data: Omit<PredefinedTag, "id">,
): Promise<PredefinedTag> {
  const res = await fetch("/api/v1/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<PredefinedTag>(res);
}

export async function fetchAppVersions(id: string): Promise<string[]> {
  const res = await fetch(`/api/v1/apps/${id}/versions`);
  if (!res.ok) return [];
  return res.json() as Promise<string[]>;
}

export async function deployApp(id: string, version: string): Promise<void> {
  const res = await fetch(`/api/v1/apps/${id}/deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version }),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Deploy failed: ${res.status}`);
  }
}

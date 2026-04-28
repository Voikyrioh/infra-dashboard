import { defineStore } from "pinia";
import { ref } from "vue";
import type { App, PredefinedTag, ConfigureAppPayload } from "@/services/apps.service";
import {
  syncApps,
  fetchApps,
  configureApp,
  fetchTags,
  createTag,
} from "@/services/apps.service";

export const useAppsStore = defineStore("apps", () => {
  const apps = ref<App[]>([]);
  const tags = ref<PredefinedTag[]>([]);
  const loading = ref(false);

  async function loadApps() {
    loading.value = true;
    try {
      apps.value = await fetchApps();
    } finally {
      loading.value = false;
    }
  }

  async function sync() {
    loading.value = true;
    try {
      apps.value = await syncApps();
    } finally {
      loading.value = false;
    }
  }

  async function loadTags() {
    tags.value = await fetchTags();
  }

  async function configure(id: string, payload: ConfigureAppPayload) {
    const updated = await configureApp(id, payload);
    const idx = apps.value.findIndex((a) => a.id === id);
    if (idx !== -1) apps.value[idx] = updated;
  }

  async function addTag(data: Omit<PredefinedTag, "id">): Promise<PredefinedTag> {
    const tag = await createTag(data);
    tags.value.push(tag);
    return tag;
  }

  return { apps, tags, loading, loadApps, sync, loadTags, configure, addTag };
});

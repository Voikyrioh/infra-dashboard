import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import ApplicationsPage from "./ApplicationsPage.vue";
import * as appsService from "@/services/apps.service";

describe("ApplicationsPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("affiche le titre 'Applications'", async () => {
    vi.spyOn(appsService, "fetchApps").mockResolvedValue([]);
    vi.spyOn(appsService, "fetchTags").mockResolvedValue([]);
    const wrapper = mount(ApplicationsPage);
    expect(wrapper.text()).toContain("Applications");
  });

  it("affiche le bouton Synchroniser", () => {
    vi.spyOn(appsService, "fetchApps").mockResolvedValue([]);
    vi.spyOn(appsService, "fetchTags").mockResolvedValue([]);
    const wrapper = mount(ApplicationsPage);
    expect(wrapper.text()).toContain("Synchroniser");
  });

  it("affiche le header du tableau", async () => {
    vi.spyOn(appsService, "fetchApps").mockResolvedValue([]);
    vi.spyOn(appsService, "fetchTags").mockResolvedValue([]);
    const wrapper = mount(ApplicationsPage);
    expect(wrapper.text()).toContain("Application");
    expect(wrapper.text()).toContain("Deploy");
    expect(wrapper.text()).toContain("Container");
  });
});

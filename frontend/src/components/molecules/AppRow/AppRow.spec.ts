import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import AppRow from "./AppRow.vue";
import type { App } from "@/services/apps.service";

const configuredApp: App = {
  id: "1",
  repoName: "my-app",
  repoUrl: "https://github.com/voikyrioh/my-app",
  displayName: "My App",
  type: "backend",
  containerName: "my-app",
  configured: true,
  lastSyncedAt: null,
  createdAt: "2026-01-01",
  tags: [{ id: "t1", category: "database", label: "PostgreSQL", color: "#336791" }],
  deployStatus: { conclusion: "success", runAt: null },
  containerStatus: "running",
};

const unconfiguredApp: App = {
  ...configuredApp,
  displayName: null,
  type: null,
  containerName: null,
  configured: false,
  tags: [],
  deployStatus: null,
  containerStatus: null,
};

describe("AppRow", () => {
  it("affiche le displayName si configurée", () => {
    const wrapper = mount(AppRow, { props: { app: configuredApp } });
    expect(wrapper.text()).toContain("My App");
  });

  it("affiche le repoName si non configurée", () => {
    const wrapper = mount(AppRow, { props: { app: unconfiguredApp } });
    expect(wrapper.text()).toContain("my-app");
  });

  it("affiche le badge 'À configurer' si non configurée", () => {
    const wrapper = mount(AppRow, { props: { app: unconfiguredApp } });
    expect(wrapper.text()).toContain("À configurer");
  });

  it("affiche le tag PostgreSQL si configurée", () => {
    const wrapper = mount(AppRow, { props: { app: configuredApp } });
    expect(wrapper.text()).toContain("PostgreSQL");
  });

  it("émet 'configure' au clic si non configurée", async () => {
    const wrapper = mount(AppRow, { props: { app: unconfiguredApp } });
    await wrapper.trigger("click");
    expect(wrapper.emitted("configure")).toBeTruthy();
  });
});

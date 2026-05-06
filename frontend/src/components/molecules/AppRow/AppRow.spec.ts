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
  containerStatus: "running",
  appName: null,
  imageName: null,
  deployedVersion: "v1.0.0",
};

const unconfiguredApp: App = {
  ...configuredApp,
  displayName: null,
  type: null,
  containerName: null,
  configured: false,
  tags: [],
  containerStatus: null,
  deployedVersion: null,
};

describe("AppRow", () => {
  it("affiche le displayName si configurée", () => {
    const wrapper = mount(AppRow, { props: { app: configuredApp, versions: ["v1.0.0", "v1.1.0"] } });
    expect(wrapper.text()).toContain("My App");
  });

  it("affiche le repoName si non configurée", () => {
    const wrapper = mount(AppRow, { props: { app: unconfiguredApp, versions: [] } });
    expect(wrapper.text()).toContain("my-app");
  });

  it("affiche le badge 'À configurer' si non configurée", () => {
    const wrapper = mount(AppRow, { props: { app: unconfiguredApp, versions: [] } });
    expect(wrapper.text()).toContain("À configurer");
  });

  it("affiche le tag PostgreSQL si configurée", () => {
    const wrapper = mount(AppRow, { props: { app: configuredApp, versions: [] } });
    expect(wrapper.text()).toContain("PostgreSQL");
  });

  it("émet 'configure' au clic si non configurée", async () => {
    const wrapper = mount(AppRow, { props: { app: unconfiguredApp, versions: [] } });
    await wrapper.trigger("click");
    expect(wrapper.emitted("configure")).toBeTruthy();
  });

  it("émet 'deploy' avec l'id et la version quand VersionSelect déclenche deploy", async () => {
    const wrapper = mount(AppRow, {
      props: { app: configuredApp, versions: ["v1.0.0", "v1.1.0"] },
    });
    wrapper.vm.$emit("deploy", configuredApp.id, "v1.1.0");
    await wrapper.vm.$nextTick();
    const emitted = wrapper.emitted("deploy") as [string, string][] | undefined;
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual([configuredApp.id, "v1.1.0"]);
  });
});

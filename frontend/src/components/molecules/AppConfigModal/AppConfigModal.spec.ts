import { mount } from "@vue/test-utils";
import { describe, it, expect, afterEach } from "vitest";
import AppConfigModal from "./AppConfigModal.vue";
import type { App, PredefinedTag } from "@/services/apps.service";

const app: App = {
  id: "1",
  repoName: "my-app",
  repoUrl: "https://github.com/voikyrioh/my-app",
  displayName: null,
  type: null,
  containerName: null,
  configured: false,
  lastSyncedAt: null,
  createdAt: "2026-01-01",
  tags: [],
  deployStatus: null,
  containerStatus: null,
};

const tags: PredefinedTag[] = [
  { id: "t1", category: "database", label: "PostgreSQL", color: "#336791" },
  { id: "t2", category: "database", label: "Redis", color: "#DC382D" },
];

function getBodyText() {
  return document.body.textContent ?? "";
}

function bodyFind(selector: string) {
  return document.body.querySelector(selector);
}

describe("AppConfigModal", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("affiche le nom du repo dans le header", () => {
    mount(AppConfigModal, {
      props: { app, tags, modelValue: true },
      attachTo: document.body,
    });
    expect(getBodyText()).toContain("voikyrioh/my-app");
  });

  it("affiche les tags disponibles", () => {
    mount(AppConfigModal, {
      props: { app, tags, modelValue: true },
      attachTo: document.body,
    });
    expect(getBodyText()).toContain("PostgreSQL");
    expect(getBodyText()).toContain("Redis");
  });

  it("émet 'update:modelValue' false au clic Annuler", async () => {
    const wrapper = mount(AppConfigModal, {
      props: { app, tags, modelValue: true },
      attachTo: document.body,
    });
    const cancelBtn = bodyFind("[data-testid='cancel']") as HTMLElement;
    cancelBtn.click();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
  });

  it("émet 'submit' avec le payload au clic Enregistrer", async () => {
    const wrapper = mount(AppConfigModal, {
      props: { app, tags, modelValue: true },
      attachTo: document.body,
    });

    const inputName = bodyFind("[data-testid='input-name']") as HTMLInputElement;
    inputName.value = "My App";
    inputName.dispatchEvent(new Event("input"));

    const typeBackend = bodyFind("[data-testid='type-backend']") as HTMLElement;
    typeBackend.click();

    const inputContainer = bodyFind("[data-testid='input-container']") as HTMLInputElement;
    inputContainer.value = "my-app";
    inputContainer.dispatchEvent(new Event("input"));

    await wrapper.vm.$nextTick();

    const saveBtn = bodyFind("[data-testid='save']") as HTMLElement;
    saveBtn.click();
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted("submit")?.[0]?.[0] as any;
    expect(emitted.displayName).toBe("My App");
    expect(emitted.type).toBe("backend");
    expect(emitted.containerName).toBe("my-app");
    expect(emitted.tagIds).toEqual([]);
  });
});

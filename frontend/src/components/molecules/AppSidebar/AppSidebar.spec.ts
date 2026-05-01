import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import AppSidebar from "./AppSidebar.vue";

vi.mock("@/libraries/theme", () => ({
  useTheme: () => ({ isDark: { value: true }, toggle: vi.fn() }),
}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: "/", component: { template: "<div/>" } },
    { path: "/dashboard", component: { template: "<div/>" } },
    { path: "/applications", component: { template: "<div/>" } },
  ],
});

describe("AppSidebar", () => {
  it("affiche le logo [d]", () => {
    const wrapper = mount(AppSidebar, {
      global: { plugins: [createPinia(), router] },
    });
    expect(wrapper.find(".app-sidebar__logo").text()).toContain("[d]");
  });

  it("contient un lien vers /dashboard", () => {
    const wrapper = mount(AppSidebar, {
      global: { plugins: [createPinia(), router] },
    });
    const dashboardLink = wrapper.find('[href="/dashboard"]');
    expect(dashboardLink.exists()).toBe(true);
  });

  it("contient un lien vers /applications", () => {
    const wrapper = mount(AppSidebar, {
      global: { plugins: [createPinia(), router] },
    });
    const appsLink = wrapper.find('[href="/applications"]');
    expect(appsLink.exists()).toBe(true);
  });

  it("affiche le bouton theme toggle", () => {
    const wrapper = mount(AppSidebar, {
      global: { plugins: [createPinia(), router] },
    });
    expect(wrapper.find(".app-sidebar__theme-btn").exists()).toBe(true);
  });

  it("n'affiche pas le bouton logout si non authentifié", () => {
    const wrapper = mount(AppSidebar, {
      global: { plugins: [createPinia(), router] },
    });
    expect(wrapper.find(".app-sidebar__logout-btn").exists()).toBe(false);
  });
});

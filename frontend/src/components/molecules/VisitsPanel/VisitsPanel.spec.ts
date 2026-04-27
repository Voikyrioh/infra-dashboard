import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import VisitsPanel from "./VisitsPanel.vue";

describe("VisitsPanel", () => {
  it("affiche le total quand défini", () => {
    const wrapper = mount(VisitsPanel, {
      props: {
        total24h: 99,
        topApps: [{ name: "portfolio", visits: 540 }],
      },
    });
    expect(wrapper.text()).toContain("99");
  });

  it("affiche — quand total24h est null", () => {
    const wrapper = mount(VisitsPanel, {
      props: { total24h: null, topApps: [] },
    });
    expect(wrapper.text()).toContain("—");
  });

  it("affiche la liste des top apps", () => {
    const wrapper = mount(VisitsPanel, {
      props: {
        total24h: 1000,
        topApps: [
          { name: "portfolio", visits: 540 },
          { name: "api", visits: 310 },
        ],
      },
    });
    expect(wrapper.text()).toContain("portfolio");
    expect(wrapper.text()).toContain("api");
    expect(wrapper.text()).toContain("540");
  });
});

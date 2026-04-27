import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import MetricCard from "./MetricCard.vue";

describe("MetricCard", () => {
  it("affiche le titre", () => {
    const wrapper = mount(MetricCard, {
      props: { title: "CPU", value: 42, sublabel: "Actuel" },
    });
    expect(wrapper.text()).toContain("CPU");
  });

  it("affiche le sublabel", () => {
    const wrapper = mount(MetricCard, {
      props: { title: "RAM", value: 60, sublabel: "3.8 / 8 GB" },
    });
    expect(wrapper.text()).toContain("3.8 / 8 GB");
  });

  it("affiche le badge 'Reconnexion' quand status = reconnecting", () => {
    const wrapper = mount(MetricCard, {
      props: { title: "CPU", value: 0, sublabel: "", status: "reconnecting" },
    });
    expect(wrapper.text()).toContain("Reconnexion");
  });
});

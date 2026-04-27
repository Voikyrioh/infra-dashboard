import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import GaugeCircle from "./GaugeCircle.vue";

describe("GaugeCircle", () => {
  it("affiche la valeur passée en props", () => {
    const wrapper = mount(GaugeCircle, { props: { value: 42, label: "CPU" } });
    expect(wrapper.text()).toContain("42");
    expect(wrapper.text()).toContain("CPU");
  });

  it("utilise la couleur émeraude quand value < 70", () => {
    const wrapper = mount(GaugeCircle, { props: { value: 50, label: "CPU" } });
    const arc = wrapper.find(".gauge__arc");
    expect(arc.attributes("stroke")).toContain("var(--color-emerald)");
  });

  it("utilise la couleur amber quand 70 ≤ value < 90", () => {
    const wrapper = mount(GaugeCircle, { props: { value: 75, label: "CPU" } });
    const arc = wrapper.find(".gauge__arc");
    expect(arc.attributes("stroke")).toContain("var(--color-amber)");
  });

  it("utilise la couleur error quand value ≥ 90", () => {
    const wrapper = mount(GaugeCircle, { props: { value: 95, label: "CPU" } });
    const arc = wrapper.find(".gauge__arc");
    expect(arc.attributes("stroke")).toContain("var(--color-error)");
  });
});

import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import TagPill from "./TagPill.vue";

describe("TagPill", () => {
  it("affiche le label", () => {
    const wrapper = mount(TagPill, {
      props: { label: "PostgreSQL", color: "#336791" },
    });
    expect(wrapper.text()).toContain("PostgreSQL");
  });

  it("applique la couleur comme variable CSS", () => {
    const wrapper = mount(TagPill, {
      props: { label: "Redis", color: "#DC382D" },
    });
    expect(wrapper.html()).toContain("#DC382D");
  });

  it("émet 'toggle' au clic en mode selectable", async () => {
    const wrapper = mount(TagPill, {
      props: { label: "Redis", color: "#DC382D", selectable: true, selected: false },
    });
    await wrapper.trigger("click");
    expect(wrapper.emitted("toggle")).toBeTruthy();
  });

  it("n'émet rien au clic si selectable est false", async () => {
    const wrapper = mount(TagPill, {
      props: { label: "Redis", color: "#DC382D", selectable: false },
    });
    await wrapper.trigger("click");
    expect(wrapper.emitted("toggle")).toBeFalsy();
  });
});

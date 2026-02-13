import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import VueSelect from "vue3-select-component";
import { nextTick } from "vue";

import diseaseOptions from '@/data/options/diseaseOptions.json';
import { useAppStore } from '@/stores/appStore';
import FocusSelect from '@/components/PlotControls.vue'

describe('FocusSelect component', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  it("filtering the select menu works correctly", async () => {
    const wrapper = mount(FocusSelect);

    const vueSelect = wrapper.findComponent(VueSelect);
    await vueSelect.find(".dropdown-icon").trigger("click");

    const input = vueSelect.find('input[type="text"]');
    await input.setValue("Asia");
    await nextTick();

    const renderedOptions = vueSelect.findAll(".menu .menu-option");
    expect(renderedOptions.length).toBe(3);
    expect(renderedOptions[0].text()).toBe("Central and Southern Asia");
    expect(renderedOptions[1].text()).toBe("Eastern and South-Eastern Asia");
    expect(renderedOptions[2].text()).toBe("Northern Africa and Western Asia");
  });

  it("updates the focus label and select options when exploreBy selection changes", async () => {
    const wrapper = mount(FocusSelect);
    const appStore = useAppStore();

    const vueSelect = wrapper.findComponent(VueSelect);
    expect(vueSelect.props("modelValue")).toBe("global");

    appStore.exploreBy = "disease";
    await nextTick();

    expect(wrapper.find(`label#focusLabel`).element.textContent).toMatch(/Focus Disease/);
    expect(vueSelect.props("modelValue")).toBe("Cholera");
    // Expect the focus select to have updated options
    await vueSelect.find(".dropdown-icon").trigger("click");
    const renderedOptions = vueSelect.findAll(".menu .menu-option").filter(e => e.attributes("aria-disabled") === "false");
    expect(renderedOptions.length).toBe(diseaseOptions.length);
    expect(renderedOptions[0].text()).toBe("Cholera");

    appStore.exploreBy = "location";
    await nextTick();

    expect(wrapper.find(`label#focusLabel`).element.textContent).toMatch(/Focus Geography/);
    expect(vueSelect.props("modelValue")).toBe("global");
  });

  it("handles multi-focus mode toggle correctly (when exploring by location)", async () => {
    const wrapper = mount(FocusSelect);

    const vueSelect = wrapper.findComponent(VueSelect);

    const multiFocusCheckbox = wrapper.findAll('label').find(e => e.text().includes("Allow multiple focus selections"))?.find('input');
    await multiFocusCheckbox.setValue(true);

    await nextTick();

    expect(vueSelect.props("modelValue")).toEqual(["global"]);
    vueSelect.vm.$emit("update:modelValue", ["AFG", "Central and Southern Asia"]);
    await nextTick();
    expect(vueSelect.props("modelValue")).toEqual(["AFG", "Central and Southern Asia"]);

    await multiFocusCheckbox.setValue(false);
    await nextTick();

    expect(vueSelect.props("modelValue")).toBe("AFG");
  });

  it("handles multi-focus mode toggle correctly (when exploring by disease)", async () => {
    const wrapper = mount(FocusSelect);
    const appStore = useAppStore();
    appStore.exploreBy = "disease";
    await nextTick();

    const vueSelect = wrapper.findComponent(VueSelect);

    const multiFocusCheckbox = wrapper.findAll('label').find(e => e.text().includes("Allow multiple focus selections"))?.find('input');
    await multiFocusCheckbox.setValue(true);

    await nextTick();

    expect(vueSelect.props("modelValue")).toEqual(["Cholera"]);
    vueSelect.vm.$emit("update:modelValue", ["Malaria", "Measles"]);
    await nextTick();
    expect(vueSelect.props("modelValue")).toEqual(["Malaria", "Measles"]);

    await multiFocusCheckbox.setValue(false);
    await nextTick();

    expect(vueSelect.props("modelValue")).toBe("Malaria");
  });
});

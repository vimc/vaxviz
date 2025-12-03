import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia';
import VueSelect from "vue3-select-component";
import { nextTick } from "vue";

import Controls from '@/components/Controls.vue'
import { useAppStore } from "@/stores/appStore";

describe('Controls component', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const store = useAppStore();
    await store.initialize();
  });

  it('renders correctly', async () => {
    const wrapper = mount(Controls)
    const labels = wrapper.findAll('label').map(label => label.text());
    expect(labels).toEqual([
      "Disease",
      "Geography",
      "Focus Geography",
      "Split by activity type",
      "Log scale",
      "DALYs averted",
      "Deaths averted",
    ]);

    const exploreByRadios = wrapper.findAll('input[name="exploreBy"]');
    expect((exploreByRadios.find(e => e.element.value === "disease")?.element.checked)).toBe(false);
    expect((exploreByRadios.find(e => e.element.value === "location")?.element.checked)).toBe(true);

    const vueSelect = wrapper.findComponent(VueSelect);
    expect(vueSelect.props("aria").labelledby).toEqual("focusLabel");
    expect(wrapper.find(`label#focusLabel`).element.textContent).toMatch(/Focus Geography/);
    expect(vueSelect.props("modelValue")).toBe("global");
    await vueSelect.find(".dropdown-icon").trigger("click");
    const disabledOptions = vueSelect.findAll(".menu .menu-option").filter(e => e.attributes("aria-disabled") === "true");
    expect(disabledOptions.length).toBe(3);
    expect(disabledOptions[0].text()).toEqual("Global");
    expect(disabledOptions[1].text()).toEqual("Subregions");
    expect(disabledOptions[2].text()).toEqual("Countries");
    const selectableOptions = vueSelect.findAll(".menu .menu-option").filter(e => e.attributes("aria-disabled") === "false");
    expect(selectableOptions.length).toBe(128);
    expect(selectableOptions[0].text()).toBe("All 117 VIMC countries");
    expect(selectableOptions[1].text()).toBe("Central and Southern Asia");
    expect(selectableOptions[11].text()).toBe("Afghanistan");

    const logScaleCheckbox = wrapper.findAll('label').find(e => e.text().includes("Log scale"))?.find('input');
    expect(logScaleCheckbox.element.checked).toBe(true);

    const splitByActivityTypeCheckbox = wrapper.findAll('label').find(e => e.text().includes("Split by activity type"))?.find('input');
    expect(splitByActivityTypeCheckbox.element.checked).toBe(false);

    const burdenMetricRadios = wrapper.findAll('input[name="burdenMetric"]');
    expect((burdenMetricRadios.find(e => e.element.value === "dalys")?.element.checked)).toBe(false);
    expect((burdenMetricRadios.find(e => e.element.value === "deaths")?.element.checked)).toBe(true);
  });

  it("updates the focus label and select options when exploreBy selection changes", async () => {
    const wrapper = mount(Controls);

    const vueSelect = wrapper.findComponent(VueSelect);
    expect(vueSelect.props("modelValue")).toBe("global");

    wrapper.findAll('input[name="exploreBy"]').find(e => e.element.value === "disease")?.setChecked();
    await nextTick();

    expect(wrapper.find(`label#focusLabel`).element.textContent).toMatch(/Focus Disease/);
    expect(vueSelect.props("modelValue")).toBe("Cholera");
    // Expect the focus select to have updated options
    await vueSelect.find(".dropdown-icon").trigger("click");
    const renderedOptions = vueSelect.findAll(".menu .menu-option").filter(e => e.attributes("aria-disabled") === "false");
    expect(renderedOptions.length).toBe(14);
    expect(renderedOptions[0].text()).toBe("Cholera");

    wrapper.findAll('input[name="exploreBy"]').find(e => e.element.value === "location")?.setChecked();
    await nextTick();

    expect(wrapper.find(`label#focusLabel`).element.textContent).toMatch(/Focus Geography/);
    expect(vueSelect.props("modelValue")).toBe("global");
  });

  it("filtering the select menu when exploring by geography works correctly", async () => {
    const wrapper = mount(Controls);

    wrapper.findAll('input[name="exploreBy"]').find(e => e.element.value === "location")?.setChecked();
    await nextTick();

    const vueSelect = wrapper.findComponent(VueSelect);
    await vueSelect.find(".dropdown-icon").trigger("click");

    const input = vueSelect.find('input[type="text"]');
    await input.setValue("Asia");
    await nextTick();

    const disabledOptions = vueSelect.findAll(".menu .menu-option").filter(e => e.attributes("aria-disabled") === "true");
    expect(disabledOptions.length).toBe(3);
    expect(disabledOptions[0].text()).toEqual("Global");
    expect(disabledOptions[1].text()).toEqual("Subregions");
    expect(disabledOptions[2].text()).toEqual("Countries");
    const renderedOptions = vueSelect.findAll(".menu .menu-option").filter(e => e.attributes("aria-disabled") === "false");
    expect(renderedOptions.length).toBe(3);
    expect(renderedOptions[0].text()).toBe("Central and Southern Asia");
    expect(renderedOptions[1].text()).toBe("Eastern and South-Eastern Asia");
    expect(renderedOptions[2].text()).toBe("Northern Africa and Western Asia");
  });
})

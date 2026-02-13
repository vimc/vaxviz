import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import VueSelect from "vue3-select-component";
import { nextTick } from "vue";

import PlotControls from '@/components/PlotControls.vue'
import { useHelpInfoStore } from '@/stores/helpInfoStore';

describe('PlotControls component', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  it('renders correctly', async () => {
    const wrapper = mount(PlotControls)
    const labels = wrapper.findAll('label').map(label => label.text());
    ["Disease",
      "Geography",
      "Focus Geography",
      "DALYs averted",
      "Deaths averted",
      "Split by activity type",
      "Log scale"
    ].forEach(expectedLabelText => {
      expect(labels).toContain(expectedLabelText);
    });

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

  it("shows the negative estimates help info when decreed by the help info store", async () => {
    const wrapper = mount(PlotControls);

    expect(wrapper.findAll('button').find(e => e.text().includes("Noticing negative estimates?"))).toBeUndefined();

    const helpInfoStore = useHelpInfoStore();
    helpInfoStore.showNegativeValuesHelpInfo = true;
    await nextTick();

    expect(wrapper.findAll('button').find(e => e.text().includes("Noticing negative estimates?"))).toBeDefined();
  });

  it("show the log scale help info when log scale is enabled", async () => {
    const wrapper = mount(PlotControls);

    expect(wrapper.findAll('button').find(e => e.text().includes("Note: you are viewing estimates on a log 10 scale"))).toBeDefined();

    const logScaleCheckbox = wrapper.findAll('label').find(e => e.text().includes("Log scale"))?.find('input');
    await logScaleCheckbox.setValue(false);
    await nextTick();

    expect(wrapper.findAll('button').find(e => e.text().includes("Note: you are viewing estimates on a log 10 scale"))).toBeUndefined();
  });
})

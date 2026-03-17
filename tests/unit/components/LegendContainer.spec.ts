import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { nextTick } from "vue";
import LegendContainer from '@/components/LegendContainer.vue'
import { useHelpInfoStore } from '@/stores/helpInfoStore';
import { useAppStore } from '@/stores/appStore'

describe('legend container component', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  const renderComponent = () => {
    return mount(LegendContainer, {
      props: {
        focusesWithoutData: []
      }
    });
  }

  it("shows the negative estimates help info when decreed by the help info store", async () => {
    const wrapper = renderComponent();

    expect(wrapper.findAll('[role="alert"]').find(e => e.text().includes("Some estimates are negative"))).toBeUndefined();

    const helpInfoStore = useHelpInfoStore();
    helpInfoStore.showNegativeValuesHelpInfo = true;
    await nextTick();

    expect(wrapper.findAll('[role="alert"]').find(e => e.text().includes("Some estimates are negative"))).toBeDefined();
  });

  it("show the log scale help info when log scale is enabled", async () => {
    const wrapper = renderComponent();

    expect(wrapper.findAll('[role="alert"]').find(e => e.text().includes("Note: you are viewing estimates on a log 10 scale"))).toBeDefined();

    const appStore = useAppStore();
    appStore.logScaleEnabled = false;
    await nextTick();

    expect(wrapper.findAll('[role="alert"]').find(e => e.text().includes("Note: you are viewing estimates on a log 10 scale"))).toBeUndefined();
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia';
import AppHeader from '@/components/AppHeader.vue';

describe('AppHeader component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the about modal when the about button is clicked', async () => {
    const wrapper = mount(AppHeader);
    expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(false);

    const aboutButton = wrapper.find('button#aboutLink');
    await aboutButton.trigger('click');

    await vi.waitFor(() => {
      expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'FwbModal' }).isVisible()).toBe(true);
    })

    // Check that the version number is displayed correctly
    expect(wrapper.text()).toMatch(/Vaxviz version: \d+\.\d+\.\d+/);
  });

  it('shows the page heading when the alert is dimissed', async () => {
    const wrapper = mount(AppHeader);
    expect(wrapper.find('h1').exists()).toBe(false);

    const alertCloseButton = wrapper.find('button', { name: "Dismiss" });
    await alertCloseButton.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.find('h1').exists()).toBe(true);
      expect(wrapper.find('h1').text()).toContain('VAXVIZ');
    });
  });
});

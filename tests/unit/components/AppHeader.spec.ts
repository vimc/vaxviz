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
  });
});

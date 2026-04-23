import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';

import HelpInfo from '@/components/HelpInfo.vue';

const renderComponent = () => {
  return mount(HelpInfo, {
    props: {
      header: 'Test Header',
    },
    slots: {
      body: 'Paragraph content',
    },
  });
};

describe('HelpInfo component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders trigger button with sr-only label and does not show the modal initially', () => {
    const wrapper = renderComponent();

    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.find('.sr-only').text()).toBe('Help with Test Header');
    expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(false);
  });

  it('opens the modal with header and body slot when the trigger is clicked', async () => {
    const wrapper = renderComponent();

    await wrapper.find('button').trigger('click');

    await vi.waitFor(() => {
      const modal = wrapper.findComponent({ name: 'FwbModal' });
      expect(modal.exists()).toBe(true);
      expect(modal.text()).toContain('Test Header');
      expect(modal.text()).toContain('Paragraph content');
    });
  });

  it('closes the modal when the close event is emitted', async () => {
    const wrapper = renderComponent();

    await wrapper.find('button').trigger('click');

    await vi.waitFor(() => {
      expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(true);
    });

    await wrapper.findComponent({ name: 'FwbModal' }).vm.$emit('close');

    await vi.waitFor(() => {
      expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(false);
    });
  });
});

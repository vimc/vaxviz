import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';

import HelpInfoModalButton from '@/components/HelpInfoModalButton.vue';

const renderComponent = () => {
  return mount(HelpInfoModalButton, {
    props: {
      header: 'Test Header',
    },
    slots: {
      body: 'Paragraph content',
    },
  });
}

describe('HelpInfoModalButton component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the button with the header text and does not show the modal initially', () => {
    const wrapper = renderComponent();

    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.text()).toContain('Test Header');
    expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(false);
  });

  it('shows the modal when the button is clicked', async () => {
    const wrapper = renderComponent();

    const button = wrapper.find('button');
    await button.trigger('click');

    await vi.waitFor(() => {
      expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'FwbModal' }).isVisible()).toBe(true);
    });
  });

  it('displays the header in the modal', async () => {
    const wrapper = renderComponent();

    await wrapper.find('button').trigger('click');

    await vi.waitFor(() => {
      const modal = wrapper.findComponent({ name: 'FwbModal' });
      expect(modal.text()).toContain('Test Header');
    });
  });

  it('displays the body slot in the modal body', async () => {
    const wrapper = renderComponent();

    await wrapper.find('button').trigger('click');

    await vi.waitFor(() => {
      const modal = wrapper.findComponent({ name: 'FwbModal' });
      expect(modal.text()).toContain('Paragraph content');
    });
  });

  it('closes the modal when close event is emitted', async () => {
    const wrapper = renderComponent();

    await wrapper.find('button').trigger('click');

    await vi.waitFor(() => {
      expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(true);
    });

    const modal = wrapper.findComponent({ name: 'FwbModal' });
    await modal.vm.$emit('close');

    await vi.waitFor(() => {
      expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(false);
    });
  });
});

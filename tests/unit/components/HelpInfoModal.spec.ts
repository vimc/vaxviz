import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';

import HelpInfoModal from '@/components/HelpInfoModal.vue';

const renderComponent = () => {
  return mount(HelpInfoModal, {
    props: {
      id: 'test',
      alertText: 'Test alert text',
      header: 'Test Header',
    },
    slots: {
      body: 'Paragraph content',
    },
  });
}

describe('HelpInfoModal component', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('renders the alert with the alert text and does not show the modal initially', () => {
    const wrapper = renderComponent();

    const alert = wrapper.find('[role="alert"]');
    expect(alert.text()).toContain('Test alert text');
    expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(false);
  });

  it('does not render the alert if it has been permanently dismissed', () => {
    localStorage.setItem("helpInfoDismissed_test", "true")
    
    const wrapper = renderComponent();

    const alert = wrapper.find('[role="alert"]');
    expect(alert.exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(false);
  });

  it('closes the alert when dismissed permanently', async () => {
    const wrapper = renderComponent();

    const dismissButton = wrapper.findAll('button')[1];
    expect(dismissButton.text()).toBe('Dismiss forever');
    dismissButton.trigger('click');

    await vi.waitFor(() => {
      const alert = wrapper.find('[role="alert"]');
      expect(alert.exists()).toBe(false);
      expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(false);
    });
  });

  it('shows the modal when the "learn more" button is clicked', async () => {
    const wrapper = renderComponent();

    const learnMoreButton = wrapper.findAll('button')[0];
    expect(learnMoreButton.text()).toBe('Learn more');
    await learnMoreButton.trigger('click');

    await vi.waitFor(() => {
      expect(wrapper.findComponent({ name: 'FwbModal' }).isVisible()).toBe(true);
    });
  });

  it('displays the header and body slot in the modal', async () => {
    const wrapper = renderComponent();

    await wrapper.find('button').trigger('click');

    await vi.waitFor(() => {
      const modal = wrapper.findComponent({ name: 'FwbModal' });
      expect(modal.text()).toContain('Test Header');
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

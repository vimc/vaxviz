import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';

import HelpInfoModalButton from '@/components/HelpInfoModalButton.vue';
import { useHelpInfoStore } from '@/stores/helpInfoStore';

const renderComponent = (animationsAllowed?: boolean) => {
  return mount(HelpInfoModalButton, {
    props: {
      header: 'Test Header',
      animationsAllowed,
    },
    slots: {
      body: 'Paragraph content',
    },
  });
};

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

  describe('animations', () => {
    it('allows initial animation on the first time the message has been shown', () => {
      const helpInfoStore = useHelpInfoStore();
      helpInfoStore.negativeHelpInfoShowCount = 1;

      const wrapper = renderComponent(true);
      expect(wrapper.find('button').classes()).toContain('allowInitialAnimation');
    });

    it('does not allow initial animation when the message has already been shown before', async () => {
      const helpInfoStore = useHelpInfoStore();
      helpInfoStore.negativeHelpInfoShowCount = 2;

      const wrapper = renderComponent(true);
      expect(wrapper.find('button').classes()).not.toContain('allowInitialAnimation');
    });

    describe('highlight class', () => {
      it('adds highlight class when all conditions are met', () => {
        const helpInfoStore = useHelpInfoStore();
        helpInfoStore.negativeValueHelpMessageIsHighlighted = true;
        helpInfoStore.negativeHelpInfoHighlightCount = 1;

        const wrapper = renderComponent(true);
        expect(wrapper.find('p.help-text').classes()).toContain('highlight');
      });

      it('does not add highlight class when negativeValueHelpMessageIsHighlighted is false', () => {
        const helpInfoStore = useHelpInfoStore();
        helpInfoStore.negativeValueHelpMessageIsHighlighted = false;
        helpInfoStore.negativeHelpInfoHighlightCount = 1;

        const wrapper = renderComponent(true);
        expect(wrapper.find('p.help-text').classes()).not.toContain('highlight');
      });

      it('does not add highlight class when the text has already been highlighted before', () => {
        const helpInfoStore = useHelpInfoStore();
        helpInfoStore.negativeValueHelpMessageIsHighlighted = true;
        helpInfoStore.negativeHelpInfoHighlightCount = 2;

        const wrapper = renderComponent(true);
        expect(wrapper.find('p.help-text').classes()).not.toContain('highlight');
      });
    });
  });
});

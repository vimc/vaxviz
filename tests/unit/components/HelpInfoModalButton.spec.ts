import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';

import HelpInfoModalButton from '@/components/HelpInfoModalButton.vue';

describe('HelpInfoModalButton component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the button with the header text and does not show the modal initially', () => {
    const wrapper = mount(HelpInfoModalButton, {
      props: {
        header: 'Test Header',
        paragraphs: ['First paragraph'],
      },
    });

    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.text()).toContain('Test Header');
    expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(false);
  });

  it('shows the modal when the button is clicked', async () => {
    const wrapper = mount(HelpInfoModalButton, {
      props: {
        header: 'Test Header',
        paragraphs: ['Paragraph content'],
      },
    });

    const button = wrapper.find('button');
    await button.trigger('click');

    await vi.waitFor(() => {
      expect(wrapper.findComponent({ name: 'FwbModal' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'FwbModal' }).isVisible()).toBe(true);
    });
  });

  it('displays the header in the modal', async () => {
    const wrapper = mount(HelpInfoModalButton, {
      props: {
        header: 'Modal Header Text',
        paragraphs: ['Content'],
      },
    });

    await wrapper.find('button').trigger('click');

    await vi.waitFor(() => {
      const modal = wrapper.findComponent({ name: 'FwbModal' });
      expect(modal.text()).toContain('Modal Header Text');
    });
  });

  it('can display multiple paragraphs in the modal body', async () => {
    const paragraphs = [
      'First paragraph with important info.',
      'Second paragraph with more details.',
      'Third paragraph concluding the help.',
    ];

    const wrapper = mount(HelpInfoModalButton, {
      props: {
        header: 'Detailed Help',
        paragraphs,
      },
    });

    await wrapper.find('button').trigger('click');

    await vi.waitFor(() => {
      const modal = wrapper.findComponent({ name: 'FwbModal' });
      paragraphs.forEach((paragraph) => {
        expect(modal.text()).toContain(paragraph);
      });
    });
  });

  it('closes the modal when close event is emitted', async () => {
    const wrapper = mount(HelpInfoModalButton, {
      props: {
        header: 'Test',
        paragraphs: ['Content'],
      },
    });

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

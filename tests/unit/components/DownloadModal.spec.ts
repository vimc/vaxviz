import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { nextTick } from 'vue';

import VueSelect from "vue3-select-component";

import DownloadModal from '@/components/DownloadModal.vue';
import DownloadSelect from '@/components/DownloadSelect.vue';

describe('DownloadModal component', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  it('should not show the modal initially', () => {
    const wrapper = mount(DownloadModal);

    expect(wrapper.findComponent(DownloadSelect).exists()).toBe(false);
  });

  it('should show the modal when the Downloads button is clicked', async () => {
    const wrapper = mount(DownloadModal);

    const button = wrapper.find('button');
    await button.trigger('click');
    await nextTick();

    expect(wrapper.findComponent(DownloadSelect).exists()).toBe(true);
  });

  it('should close the modal when the close button is clicked', async () => {
    const wrapper = mount(DownloadModal);

    const button = wrapper.find('button');
    await button.trigger('click');
    await nextTick();

    const closeButton = wrapper.find('button[aria-label="close"]');
    await closeButton.trigger('click');
    await nextTick();

    expect(wrapper.findComponent(DownloadSelect).exists()).toBe(false);
  });

  it('should not close the modal when the VueSelect menu is open', async () => {
    const wrapper = mount(DownloadModal);

    const button = wrapper.find('button');
    await button.trigger('click');
    await nextTick();

    const vueSelect = wrapper.findComponent(DownloadSelect).findComponent(VueSelect);
    await vueSelect.find(".dropdown-icon").trigger("click");
    await nextTick();

    const closeButton = wrapper.find('button[aria-label="close"]');
    await closeButton.trigger('click');
    await nextTick();

    expect(wrapper.findComponent(DownloadSelect).exists()).toBe(true);
  });
});

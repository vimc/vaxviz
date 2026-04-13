import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { nextTick } from 'vue';

import DownloadModal from '@/components/DownloadModal.vue';
import DownloadSelect from '@/components/DownloadSelect.vue';
import LocationDownload from '@/components/LocationDownload.vue';

const openModal = async (wrapper: ReturnType<typeof mount>) => {
  const button = wrapper.findAll('button').find((btn) => btn.text() === "Downloads");
  await button.trigger('click');
  await nextTick();
}

const clickDownloadTypeButton = async (wrapper: ReturnType<typeof mount>, text: string) => {
  const button = wrapper.findAll('button').find((btn) => btn.text().includes(text));
  await button!.trigger('click');
  await nextTick();
}

describe('DownloadModal component', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  it('should not show the modal initially', () => {
    const wrapper = mount(DownloadModal);

    expect(wrapper.findComponent(DownloadSelect).exists()).toBe(false);
    expect(wrapper.findComponent(LocationDownload).exists()).toBe(false);
  });

  it('should show the download type chooser when the Downloads button is clicked', async () => {
    const wrapper = mount(DownloadModal);
    await openModal(wrapper);

    expect(wrapper.text()).toContain('Download location-specific estimates');
    expect(wrapper.text()).toContain('Other downloads');
    expect(wrapper.findComponent(DownloadSelect).exists()).toBe(false);
    expect(wrapper.findComponent(LocationDownload).exists()).toBe(false);
  });

  it('should show DownloadSelect when the user chooses Other downloads', async () => {
    const wrapper = mount(DownloadModal);
    await openModal(wrapper);
    await clickDownloadTypeButton(wrapper, 'Other downloads');

    expect(wrapper.findComponent(DownloadSelect).exists()).toBe(true);
    expect(wrapper.findComponent(LocationDownload).exists()).toBe(false);
  });

  it('should show LocationDownload when the user chooses location-specific estimates', async () => {
    const wrapper = mount(DownloadModal);
    await openModal(wrapper);
    await clickDownloadTypeButton(wrapper, 'Download location-specific estimates');

    expect(wrapper.findComponent(LocationDownload).exists()).toBe(true);
    expect(wrapper.findComponent(DownloadSelect).exists()).toBe(false);
  });

  it('should go back to the chooser when Back is clicked', async () => {
    const wrapper = mount(DownloadModal);
    await openModal(wrapper);
    await clickDownloadTypeButton(wrapper, 'Other downloads');
    await clickDownloadTypeButton(wrapper, 'Back');

    expect(wrapper.text()).toContain('Download location-specific estimates');
    expect(wrapper.text()).toContain('Other downloads');
    expect(wrapper.findComponent(DownloadSelect).exists()).toBe(false);
    expect(wrapper.findComponent(LocationDownload).exists()).toBe(false);
  });

  it('should close the modal when the close button is clicked', async () => {
    const wrapper = mount(DownloadModal);
    await openModal(wrapper);
    await clickDownloadTypeButton(wrapper, 'Other downloads');

    const closeButton = wrapper.find('button[aria-label="close"]');
    await closeButton.trigger('click');
    await nextTick();

    expect(wrapper.findComponent(DownloadSelect).exists()).toBe(false);
    expect(wrapper.find('button[aria-label="close"]').exists()).toBe(false);
  });

  it('should not close the modal when the VueSelect menu is open', async () => {
    const wrapper = mount(DownloadModal);
    await openModal(wrapper);
    await clickDownloadTypeButton(wrapper, 'Other downloads');

    wrapper.findComponent(DownloadSelect).vm.$emit('update:menuOpen', true);
    await nextTick();

    const closeButton = wrapper.find('button[aria-label="close"]');
    await closeButton.trigger('click');
    await nextTick();

    expect(wrapper.find('button[aria-label="close"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Download location-specific estimates');
    expect(wrapper.text()).toContain('Other downloads');
  });
});

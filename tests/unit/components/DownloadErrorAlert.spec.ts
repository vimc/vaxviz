import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';

import DownloadErrorAlert from '@/components/DownloadErrorAlert.vue';
import { useDataStore } from '@/stores/dataStore';

describe('DownloadErrorAlert component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should not render when there are no download errors', () => {
    const dataStore = useDataStore();
    dataStore.downloadErrors = [];

    const wrapper = mount(DownloadErrorAlert);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('should display error details from dataStore.downloadErrors', async () => {
    const dataStore = useDataStore();
    dataStore.downloadErrors = [
      { e: new Error('network error'), message: 'Error downloading summary data. Error: Failed to fetch' },
    ];

    const wrapper = mount(DownloadErrorAlert);
    expect(wrapper.text()).toContain('Error downloading data');
    expect(wrapper.text()).toContain('This may be an intermittent issue. Please try again.');

    const details = wrapper.find('details');

    expect(details.exists()).toBe(true);
    expect(details.text()).toContain('Error details');
    expect(details.text()).toContain('Error downloading summary data. Error: Failed to fetch');
  });

  it('should display multiple error messages joined together', async () => {
    const dataStore = useDataStore();
    dataStore.downloadErrors = [
      { e: new Error('error 1'), message: 'Error downloading file 1' },
      { e: new Error('error 2'), message: 'Error downloading file 2' },
    ];

    const wrapper = mount(DownloadErrorAlert);

    const details = wrapper.find('details');

    expect(details.text()).toContain('Error downloading file 1');
    expect(details.text()).toContain('Error downloading file 2');
  });

  it('should clear errors when close button is clicked', async () => {
    const dataStore = useDataStore();
    dataStore.downloadErrors = [
      { e: new Error('network error'), message: 'Error downloading summary data' },
    ];

    const wrapper = mount(DownloadErrorAlert);

    // Find and click close button
    const closeButton = wrapper.find('button');
    expect(closeButton.exists()).toBe(true);
    await closeButton.trigger('click');

    expect(dataStore.downloadErrors).toHaveLength(0);
  });
});

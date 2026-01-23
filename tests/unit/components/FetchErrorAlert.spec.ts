import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';

import FetchErrorAlert from '@/components/FetchErrorAlert.vue';
import { useDataStore } from '@/stores/dataStore';

describe('FetchErrorAlert component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should display error details from dataStore.fetchErrors', async () => {
    const dataStore = useDataStore();
    dataStore.fetchErrors = [
      { message: 'Error loading data from path: hist_counts_deaths_disease_log.json. TypeError: Failed to fetch' },
    ];

    const wrapper = mount(FetchErrorAlert);
    expect(wrapper.text()).toContain('This may be an intermittent issue. Try refreshing the page.');

    const details = wrapper.find('details');

    expect(details.exists()).toBe(true);
    expect(details.text()).toContain('Error details');
    expect(details.text()).toContain('Error loading data from path: hist_counts_deaths_disease_log.json. TypeError: Failed to fetch');
  });

  it('should display multiple error messages joined together', async () => {
    const dataStore = useDataStore();
    dataStore.fetchErrors = [
      { message: 'Error loading data from path: hist_counts_deaths_disease_log.json. TypeError: Failed to fetch' },
      { message: 'Error loading data from path: hist_counts_dalys_disease.json. Error: HTTP 404: Not Found' },
    ];

    const wrapper = mount(FetchErrorAlert);
    expect(wrapper.text()).toContain('This may be an intermittent issue. Try refreshing the page.');

    const details = wrapper.find('details');

    expect(details.text()).toContain('hist_counts_deaths_disease_log.json');
    expect(details.text()).toContain('hist_counts_dalys_disease.json');
  });
});

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { nextTick } from 'vue';
import VueSelect from 'vue3-select-component';

import LocationDownload from '@/components/LocationDownload.vue';
import DataErrorAlert from '@/components/DataErrorAlert.vue';
import { useAppStore } from '@/stores/appStore';
import * as downloadModule from '@/utils/csvDownload';

const mountComponent = () => mount(LocationDownload, {
  props: { menuOpen: false },
});

const setSelectedLocations = async (wrapper: ReturnType<typeof mount>, locations: string[]) => {
  const select = wrapper.findComponent(VueSelect);
  select.vm.$emit('update:modelValue', locations);
  await nextTick();
};

describe('LocationDownload component', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('pre-selects location filters that are valid download options', () => {
    const appStore = useAppStore();
    appStore.filters.location = ['global', 'AFG', 'Central and Southern Asia'];

    const wrapper = mountComponent();
    const select = wrapper.findComponent(VueSelect);

    expect(select.props('modelValue')).toEqual(['AFG', 'Central and Southern Asia']);
  });

  it('downloads the expected files for one selected country', async () => {
    const downloadSpy = vi.spyOn(downloadModule, 'downloadCsvAsSingleOrZip').mockResolvedValue(undefined);
    const wrapper = mountComponent();

    await setSelectedLocations(wrapper, ['AFG']);

    const downloadButton = wrapper.findAll('button').find((b) => b.text().includes('Download estimates'));
    await downloadButton!.trigger('click');

    expect(downloadSpy).toHaveBeenCalledWith(
      './data/csv/location_summary_tables',
      [
        'country_summary_tables/AFG_summary_tables/summary_table_dalys_disease_activity_type_country_AFG.csv',
        'country_summary_tables/AFG_summary_tables/summary_table_dalys_disease_country_AFG.csv',
        'country_summary_tables/AFG_summary_tables/summary_table_deaths_disease_activity_type_country_AFG.csv',
        'country_summary_tables/AFG_summary_tables/summary_table_deaths_disease_country_AFG.csv',
      ],
      'vaxviz_download_AFG.zip',
    );
  });

  it('shows an error alert when the download fails', async () => {
    vi.spyOn(downloadModule, 'downloadCsvAsSingleOrZip')
      .mockRejectedValueOnce(new Error('Simulated download failure'));

    const wrapper = mountComponent();
    await setSelectedLocations(wrapper, ['Central and Southern Asia']);

    expect(wrapper.findComponent(DataErrorAlert).exists()).toBe(false);

    const downloadButton = wrapper.findAll('button').find((b) => b.text().includes('Download estimates'));
    await downloadButton!.trigger('click');
    await nextTick();

    const errorAlert = wrapper.findComponent(DataErrorAlert);
    expect(errorAlert.exists()).toBe(true);
    expect(errorAlert.props('errors')).toEqual([expect.objectContaining(
      { message: expect.stringMatching(/Error downloading summary tables.*Simulated download failure/) },
    )]);
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { nextTick } from 'vue';
import VueSelect from 'vue3-select-component';

import LocationDownload from '@/components/LocationDownload.vue';
import DataErrorAlert from '@/components/DataErrorAlert.vue';
import { useAppStore } from '@/stores/appStore';
import * as downloadModule from '@/utils/csvDownload';
import * as analyticsModule from '@/utils/analytics';

const mockDownload = () => {
  return vi.spyOn(downloadModule, 'downloadCsvAsSingleOrZip').mockResolvedValue(undefined);
};

const mockTrackDownload = () => {
  return vi.spyOn(analyticsModule, 'trackDownload').mockResolvedValue(undefined);
};

const setSelectedLocations = async (wrapper: ReturnType<typeof mount>, locations: string[]) => {
  const select = wrapper.findComponent(VueSelect);
  select.vm.$emit('update:modelValue', locations);
  await nextTick();
};

describe('LocationDownload component', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  it('pre-selects locations based on the filter', () => {
    const appStore = useAppStore();
    appStore.filters.location = ['global', 'AFG', 'Central and Southern Asia'];

    const wrapper = mount(LocationDownload, {
      props: { menuOpen: false },
    });
    const select = wrapper.findComponent(VueSelect);

    expect(select.props('modelValue')).toEqual(['AFG', 'Central and Southern Asia']);
  });

  it('downloads the expected files for a selected country', async () => {
    const downloadSpy = mockDownload();
    const analyticsSpy = mockTrackDownload();
    const wrapper = mount(LocationDownload, {
      props: { menuOpen: false },
    });

    await setSelectedLocations(wrapper, ['AFG']);

    const downloadButton = wrapper.findAll('button').find((b) => b.text().includes('Download estimates'));
    await downloadButton!.trigger('click');

    const expectedFiles = [
      'country_summary_tables/AFG_summary_tables/summary_table_dalys_disease_activity_type_country_AFG.csv',
      'country_summary_tables/AFG_summary_tables/summary_table_dalys_disease_country_AFG.csv',
      'country_summary_tables/AFG_summary_tables/summary_table_deaths_disease_activity_type_country_AFG.csv',
      'country_summary_tables/AFG_summary_tables/summary_table_deaths_disease_country_AFG.csv',
    ];

    expect(downloadSpy).toHaveBeenCalledWith(
      './data/csv/location_summary_tables',
      expectedFiles,
      'vaxviz_download_AFG.zip',
    );
    expect(analyticsSpy).toHaveBeenCalledWith("summary_table_by_location", {
      locations: ['AFG'],
      filenames: expectedFiles
    });
  });

  it('downloads the expected files for multiple selected locations', async () => {
    const downloadSpy = mockDownload();
    const analyticsSpy = mockTrackDownload();
    const wrapper = mount(LocationDownload, {
      props: { menuOpen: false },
    });

    await setSelectedLocations(wrapper, ['AFG', 'Central and Southern Asia']);

    const downloadButton = wrapper.findAll('button').find((b) => b.text().includes('Download estimates'));
    await downloadButton!.trigger('click');

    const expectedFiles = [
      'country_summary_tables/AFG_summary_tables/summary_table_dalys_disease_activity_type_country_AFG.csv',
      'country_summary_tables/AFG_summary_tables/summary_table_dalys_disease_country_AFG.csv',
      'country_summary_tables/AFG_summary_tables/summary_table_deaths_disease_activity_type_country_AFG.csv',
      'country_summary_tables/AFG_summary_tables/summary_table_deaths_disease_country_AFG.csv',
      'subregion_summary_tables/Central_and_Southern_Asia_summary_tables/summary_table_dalys_disease_subregion_activity_type_Central_and_Southern_Asia.csv',
      'subregion_summary_tables/Central_and_Southern_Asia_summary_tables/summary_table_dalys_disease_subregion_Central_and_Southern_Asia.csv',
      'subregion_summary_tables/Central_and_Southern_Asia_summary_tables/summary_table_deaths_disease_subregion_activity_type_Central_and_Southern_Asia.csv',
      'subregion_summary_tables/Central_and_Southern_Asia_summary_tables/summary_table_deaths_disease_subregion_Central_and_Southern_Asia.csv',
    ];

    expect(downloadSpy).toHaveBeenCalledWith(
      './data/csv/location_summary_tables',
      expectedFiles,
      'vaxviz_download.zip',
    );
    expect(analyticsSpy).toHaveBeenCalledWith("summary_table_by_location", {
      locations: ['AFG', 'Central and Southern Asia'],
      filenames: expectedFiles,
    });
  });


  it('shows an error alert when the download fails', async () => {
    vi.spyOn(downloadModule, 'downloadCsvAsSingleOrZip')
      .mockRejectedValueOnce(new Error('Simulated download failure'));

    const wrapper = mount(LocationDownload, {
      props: { menuOpen: false },
    });
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

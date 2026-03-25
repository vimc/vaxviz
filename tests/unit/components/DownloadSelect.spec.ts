import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { nextTick } from 'vue';
import VueSelect from "vue3-select-component";

import DownloadSelect from '@/components/DownloadSelect.vue';
import DownloadFilters from '@/components/DownloadFilters.vue';
import DataErrorAlert from '@/components/DataErrorAlert.vue';
import { useDataStore } from '@/stores/dataStore';
import * as downloadModule from '@/utils/csvDownload';
import { checkCheckbox } from '../testUtils';
import { allPossibleSummaryTables } from "@/utils/allSummaryTables";

const mockDownload = () => {
  return vi.spyOn(downloadModule, 'downloadCsvAsSingleOrZip').mockResolvedValue(undefined);
};

describe('DownloadSelect component', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mountComponent = () => mount(DownloadSelect, {
    props: { menuOpen: false },
  });

  it('should call downloadCsvAsSingleOrZip with pre-selected files from the current plot', async () => {
    const downloadSpy = mockDownload();
    const dataStore = useDataStore();
    const wrapper = mountComponent();

    const downloadSelectedBtn = wrapper.findAll('button').find(b => /Download.*selected/.test(b.text()));
    await downloadSelectedBtn!.trigger('click');

    expect(downloadSpy).toHaveBeenCalledWith(
      './data/csv',
      dataStore.summaryTableFilenames.map(f => `${f}.csv`),
      'vaxviz_download.zip',
    );
  });

  it('should download the correct files after the selection has changed', async () => {
    const downloadSpy = mockDownload();
    const wrapper = mountComponent();

    // Apply a filter and select all matching files to change the selection
    await checkCheckbox(wrapper, 'Deaths averted');

    const selectAllBtn = wrapper.findAll('button').find(b => b.text().includes('Select all files matching filters'));
    await selectAllBtn!.trigger('click');
    await nextTick();

    const downloadSelectedBtn = wrapper.findAll('button').find(b => /Download.*selected/.test(b.text()));
    await downloadSelectedBtn!.trigger('click');

    expect(downloadSpy).toHaveBeenCalledWith(
      './data/csv',
      expect.arrayContaining([
        'summary_table_deaths_disease.csv',
        'summary_table_deaths_disease_activity_type.csv',
        'summary_table_deaths_disease_subregion.csv',
        'summary_table_deaths_disease_subregion_activity_type.csv',
        'summary_table_deaths_disease_country.csv',
        'summary_table_deaths_disease_activity_type_country.csv',
      ]),
      'vaxviz_download.zip',
    );
    // Should only contain deaths files, not dalys
    const calledFilenames = downloadSpy.mock.calls[0][1];
    expect(calledFilenames.every((f: string) => f.includes('deaths'))).toBe(true);
  });

  it('should call downloadCsvAsSingleOrZip with all files when "Download all" is clicked', async () => {
    const downloadSpy = mockDownload();

    const wrapper = mountComponent();

    const downloadAllBtn = wrapper.findAll('button').find(b => b.text().includes('Download all'));
    await downloadAllBtn!.trigger('click');

    expect(downloadSpy).toHaveBeenCalledWith(
      './data/csv',
      allPossibleSummaryTables.map(f => `${f}.csv`),
      'vaxviz_download.zip',
    );
  });

  it('should store errors on download failure', async () => {
    vi.spyOn(downloadModule, 'downloadCsvAsSingleOrZip')
      .mockRejectedValueOnce(new Error("Simulated download failure"));

    const wrapper = mountComponent();

    expect(wrapper.findComponent(DataErrorAlert).exists()).toBe(false);

    const downloadSelectedBtn = wrapper.findAll('button').find(b => /Download.*selected/.test(b.text()));
    await downloadSelectedBtn!.trigger('click');

    await nextTick();

    const errorAlert = wrapper.findComponent(DataErrorAlert);
    expect(errorAlert.exists()).toBe(true);
    expect(errorAlert.props('errors')).toEqual([expect.objectContaining(
      { message: expect.stringMatching(/Error downloading summary tables.*Simulated download failure/) }
    )]);
  });

  it('should generate correct labels for file options', () => {
    const wrapper = mountComponent();

    const vueSelect = wrapper.findComponent(VueSelect);
    const options = vueSelect.props('options') as { label: string, value: string }[];

    const countryActivityType = options.find(o => o.value === 'summary_table_deaths_disease_activity_type_country');
    expect(countryActivityType!.label).toBe('Deaths impact ratios by country, split by activity type');

    const subregion = options.find(o => o.value === 'summary_table_dalys_disease_subregion');
    expect(subregion!.label).toBe('DALYs impact ratios by subregion');

    const global = options.find(o => o.value === 'summary_table_deaths_disease');
    expect(global!.label).toBe('Deaths impact ratios globally');

    const globalActivityType = options.find(o => o.value === 'summary_table_dalys_disease_activity_type');
    expect(globalActivityType!.label).toBe('DALYs impact ratios globally, split by activity type');
  });

  it('should disable options not in filteredFiles', async () => {
    const wrapper = mountComponent();

    await checkCheckbox(wrapper, 'Deaths averted');

    const vueSelect = wrapper.findComponent(VueSelect);
    const options = vueSelect.props('options') as { label: string, value: string, disabled: boolean }[];

    const deathsOption = options.find(o => o.value === 'summary_table_deaths_disease');
    expect(deathsOption!.disabled).toBe(false);

    const dalysOption = options.find(o => o.value === 'summary_table_dalys_disease');
    expect(dalysOption!.disabled).toBe(true);
  });

  it('should clear toDownload when selectAllFilesMatchingFilters is emitted with true (no filters)', async () => {
    const wrapper = mountComponent();

    // Click "Select all files matching filters" with no filters checked
    const filtersComponent = wrapper.findComponent(DownloadFilters);
    const selectAllBtn = filtersComponent.findAll('button').find(b => b.text().includes('Select all files matching filters'));
    await selectAllBtn!.trigger('click');
    await nextTick();

    // Should have 0 files selected and the download button should be disabled
    expect(wrapper.text()).toContain('Download 0 selected files');
    const downloadSelectedBtn = wrapper.findAll('button').find(b => /Download.*selected/.test(b.text()));
    expect(downloadSelectedBtn!.attributes('disabled')).toBeDefined();
  });

  it('should clear download errors when toDownload selection changes', async () => {
    vi.spyOn(downloadModule, 'downloadCsvAsSingleOrZip')
      .mockRejectedValueOnce(new Error("Simulated download failure"));

    const wrapper = mountComponent();

    const downloadSelectedBtn = wrapper.findAll('button').find(b => /Download.*selected/.test(b.text()));
    await downloadSelectedBtn!.trigger('click');
    await nextTick();

    expect(wrapper.findComponent(DataErrorAlert).exists()).toBe(true);

    // Change toDownload via selectAllFilesMatchingFilters, which modifies toDownload directly
    await checkCheckbox(wrapper, 'Deaths averted');
    const selectAllBtn = wrapper.findAll('button').find(b => b.text().includes('Select all files matching filters'));
    await selectAllBtn!.trigger('click');
    await nextTick();

    // The watch on toDownload should have cleared errors
    expect(wrapper.findComponent(DataErrorAlert).exists()).toBe(false);
  });
});

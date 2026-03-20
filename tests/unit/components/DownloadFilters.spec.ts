import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { nextTick } from 'vue';

import DownloadFilters from '@/components/DownloadFilters.vue';
import { useDataStore } from '@/stores/dataStore';
import { checkCheckbox } from '../testUtils';

describe('DownloadFilters component', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  const mountComponent = () => {
    const dataStore = useDataStore();
    const wrapper = mount(DownloadFilters, { props: { filteredFiles: dataStore.allPossibleSummaryTables } });
    return { wrapper, dataStore };
  };

  const lastEmittedFiles = (wrapper: ReturnType<typeof mount>) => {
    const emitted = wrapper.emitted('update:filteredFiles')!;
    return emitted[emitted.length - 1][0] as string[];
  };

  it('filters by burden metric', async () => {
    const { wrapper } = mountComponent();

    await checkCheckbox(wrapper, 'Deaths averted');

    const filteredFiles = lastEmittedFiles(wrapper);
    expect(filteredFiles.every(f => f.includes('deaths'))).toBe(true);
    expect(filteredFiles.some(f => f.includes('dalys'))).toBe(false);
    expect(filteredFiles).toHaveLength(6);
  });

  it('filters by geographical resolution', async () => {
    const { wrapper } = mountComponent();

    await checkCheckbox(wrapper, 'By country');

    const filteredFiles = lastEmittedFiles(wrapper);
    expect(filteredFiles.every(f => f.includes('country'))).toBe(true);
    expect(filteredFiles).toHaveLength(4);
  });

  it('filters by geographical resolution with inverse match (Global)', async () => {
    const { wrapper } = mountComponent();

    await checkCheckbox(wrapper, 'Global');

    const filteredFiles = lastEmittedFiles(wrapper);
    // "Global" files are those that contain neither "country" nor "subregion"
    expect(filteredFiles.every(f => !f.includes('country') && !f.includes('subregion'))).toBe(true);
    expect(filteredFiles).toHaveLength(4);
  });

  it('filters by activity type with inverse match (Not split)', async () => {
    const { wrapper } = mountComponent();

    await checkCheckbox(wrapper, 'Not split');

    const filteredFiles = lastEmittedFiles(wrapper);
    expect(filteredFiles.every(f => !f.includes('activity_type'))).toBe(true);
    expect(filteredFiles).toHaveLength(6);
  });

  it('combines multiple filters across groups with AND logic', async () => {
    const { wrapper } = mountComponent();

    await checkCheckbox(wrapper, 'Deaths averted');
    await checkCheckbox(wrapper, 'By country');

    const filteredFiles = lastEmittedFiles(wrapper);
    expect(filteredFiles.every(f => f.includes('deaths') && f.includes('country'))).toBe(true);
    expect(filteredFiles).toHaveLength(2);
  });

  it('combines multiple filters within a group with OR logic', async () => {
    const { wrapper } = mountComponent();

    await checkCheckbox(wrapper, 'By country');
    await checkCheckbox(wrapper, 'By subregion');

    const filteredFiles = lastEmittedFiles(wrapper);
    expect(filteredFiles.every(f => f.includes('country') || f.includes('subregion'))).toBe(true);
    expect(filteredFiles).toHaveLength(8);
  });

  it('clears all filters when the clear button is clicked', async () => {
    const { wrapper, dataStore } = mountComponent();

    await checkCheckbox(wrapper, 'Deaths averted');
    await checkCheckbox(wrapper, 'By country');
    expect(lastEmittedFiles(wrapper).length).toBeLessThan(dataStore.allPossibleSummaryTables.length);

    const clearButton = wrapper.findAll('button').find(b => b.text().includes('Clear filters'));
    await clearButton!.trigger('click');
    await nextTick();

    expect(lastEmittedFiles(wrapper)).toEqual(dataStore.allPossibleSummaryTables);
  });

  it('emits selectAllFilesMatchingFilters event when the select all button is clicked', async () => {
    const { wrapper } = mountComponent();

    const selectAllButton = wrapper.findAll('button').find(b => b.text().includes('Select all files matching filters'));
    await selectAllButton!.trigger('click');

    expect(wrapper.emitted('selectAllFilesMatchingFilters')).toHaveLength(1);
    // When no filters are checked, emits with true (filtersAreClear)
    expect(wrapper.emitted('selectAllFilesMatchingFilters')![0]).toEqual([true]);

    await checkCheckbox(wrapper, 'Deaths averted');
    await selectAllButton!.trigger('click');

    // When filters are checked, emits with false
    expect(wrapper.emitted('selectAllFilesMatchingFilters')![1]).toEqual([false]);
  });
});

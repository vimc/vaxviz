import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { nextTick } from 'vue';

import DownloadFilters from '@/components/DownloadFilters.vue';
import { useDataStore } from '@/stores/dataStore';

describe('DownloadFilters component', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  const mountComponent = () => {
    const dataStore = useDataStore();
    const wrapper = mount(DownloadFilters, {
      props: {
        filteredFiles: dataStore.allPossibleSummaryTables,
        'onUpdate:filteredFiles': (files: string[]) => wrapper.setProps({ filteredFiles: files }),
      },
    });
    return { wrapper, dataStore };
  };

  const checkCheckbox = async (wrapper: ReturnType<typeof mount>, label: string) => {
    const checkbox = wrapper.findAll('label').find(l => l.text() === label)?.find('input');
    expect(checkbox?.exists()).toBe(true);
    await checkbox!.setValue(true);
    await nextTick();
  };

  const uncheckCheckbox = async (wrapper: ReturnType<typeof mount>, label: string) => {
    const checkbox = wrapper.findAll('label').find(l => l.text() === label)?.find('input');
    await checkbox!.setValue(false);
    await nextTick();
  };

  it('renders all filter fieldsets with correct options', () => {
    const { wrapper } = mountComponent();

    const legends = wrapper.findAll('legend').map(l => l.text());
    expect(legends).toEqual([
      'Burden metrics:',
      'Geographical resolution:',
      'Activity types:',
    ]);

    const labels = wrapper.findAll('label').map(l => l.text());
    expect(labels).toEqual(expect.arrayContaining([
      'Deaths averted', 'DALYs averted',
      'By country', 'By subregion', 'Global',
      'Split', 'Not split',
    ]));
  });

  it('filters by burden metric', async () => {
    const { wrapper } = mountComponent();

    await checkCheckbox(wrapper, 'Deaths averted');

    const filteredFiles = wrapper.props('filteredFiles') as string[];
    expect(filteredFiles.every(f => f.includes('deaths'))).toBe(true);
    expect(filteredFiles.some(f => f.includes('dalys'))).toBe(false);
    expect(filteredFiles).toHaveLength(6);
  });

  it('filters by geographical resolution with direct match', async () => {
    const { wrapper } = mountComponent();

    await checkCheckbox(wrapper, 'By country');

    const filteredFiles = wrapper.props('filteredFiles') as string[];
    expect(filteredFiles.every(f => f.includes('country'))).toBe(true);
    expect(filteredFiles).toHaveLength(4);
  });

  it('filters by geographical resolution with inverse match (Global)', async () => {
    const { wrapper } = mountComponent();

    await checkCheckbox(wrapper, 'Global');

    const filteredFiles = wrapper.props('filteredFiles') as string[];
    // "Global" files are those that contain neither "country" nor "subregion"
    expect(filteredFiles.every(f => !f.includes('country') && !f.includes('subregion'))).toBe(true);
    expect(filteredFiles).toHaveLength(4);
  });

  it('filters by activity type with inverse match (Not split)', async () => {
    const { wrapper } = mountComponent();

    await checkCheckbox(wrapper, 'Not split');

    const filteredFiles = wrapper.props('filteredFiles') as string[];
    expect(filteredFiles.every(f => !f.includes('activity_type'))).toBe(true);
    expect(filteredFiles).toHaveLength(6);
  });

  it('combines filters across groups with AND logic', async () => {
    const { wrapper } = mountComponent();

    await checkCheckbox(wrapper, 'Deaths averted');
    await checkCheckbox(wrapper, 'By country');

    const filteredFiles = wrapper.props('filteredFiles') as string[];
    expect(filteredFiles.every(f => f.includes('deaths') && f.includes('country'))).toBe(true);
    expect(filteredFiles).toHaveLength(2);
  });

  it('combines filters within a group with OR logic', async () => {
    const { wrapper } = mountComponent();

    await checkCheckbox(wrapper, 'By country');
    await checkCheckbox(wrapper, 'By subregion');

    const filteredFiles = wrapper.props('filteredFiles') as string[];
    expect(filteredFiles.every(f => f.includes('country') || f.includes('subregion'))).toBe(true);
    expect(filteredFiles).toHaveLength(8);
  });

  it('shows all files when no filters are checked', () => {
    const { wrapper, dataStore } = mountComponent();

    expect(wrapper.props('filteredFiles')).toEqual(dataStore.allPossibleSummaryTables);
  });

  it('clears all filters when the clear button is clicked', async () => {
    const { wrapper, dataStore } = mountComponent();

    await checkCheckbox(wrapper, 'Deaths averted');
    await checkCheckbox(wrapper, 'By country');
    expect((wrapper.props('filteredFiles') as string[]).length).toBeLessThan(dataStore.allPossibleSummaryTables.length);

    const clearButton = wrapper.findAll('button').find(b => b.text().includes('Clear filters'));
    await clearButton!.trigger('click');
    await nextTick();

    expect(wrapper.props('filteredFiles')).toEqual(dataStore.allPossibleSummaryTables);
  });

  it('disables the clear button when no filters are checked', async () => {
    const { wrapper } = mountComponent();

    const clearButton = wrapper.findAll('button').find(b => b.text().includes('Clear filters'));
    expect(clearButton!.attributes('disabled')).toBeDefined();

    await checkCheckbox(wrapper, 'Deaths averted');
    expect(clearButton!.attributes('disabled')).toBeUndefined();

    await uncheckCheckbox(wrapper, 'Deaths averted');
    expect(clearButton!.attributes('disabled')).toBeDefined();
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

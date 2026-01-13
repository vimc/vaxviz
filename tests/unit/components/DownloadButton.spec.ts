import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia';
import { useAppStore } from '@/stores/appStore';
import DownloadButton from '@/components/DownloadButton.vue'
import * as useSummaryDownloadModule from '@/composables/useSummaryDownload';

describe('DownloadButton component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders "Download summary table" when single file', () => {
    const wrapper = mount(DownloadButton);
    expect(wrapper.text()).toBe("Download summary table");
  });

  it('renders "Download summary tables" when multiple files', () => {
    const appStore = useAppStore();
    appStore.focus = "Middle Africa"; // Subregion results in 2 files
    
    const wrapper = mount(DownloadButton);
    expect(wrapper.text()).toBe("Download summary tables");
  });

  it('calls downloadSummaryTables when clicked', async () => {
    const mockDownloadSummaryTables = vi.fn();
    vi.spyOn(useSummaryDownloadModule, 'useSummaryDownload').mockReturnValue({
      summaryTablePaths: { value: ["file.csv"] } as unknown as ReturnType<typeof useSummaryDownloadModule.useSummaryDownload>['summaryTablePaths'],
      downloadSummaryTables: mockDownloadSummaryTables,
    });

    const wrapper = mount(DownloadButton);
    await wrapper.find('button').trigger('click');

    expect(mockDownloadSummaryTables).toHaveBeenCalledOnce();
  });

  it('has cursor-pointer class for hover state', () => {
    const wrapper = mount(DownloadButton);
    const button = wrapper.find('button');
    expect(button.classes()).toContain('cursor-pointer');
  });
});

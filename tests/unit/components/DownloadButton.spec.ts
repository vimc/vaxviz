import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import DownloadButton from '@/components/DownloadButton.vue'

describe('DownloadButton component', () => {
  let originalCreateElement: typeof document.createElement;
  let createdLinks: { href: string; download: string; clicked: boolean }[];

  beforeEach(() => {
    setActivePinia(createPinia());

    createdLinks = [];
    originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === "a") {
        const link = element as HTMLAnchorElement;
        const linkData = { href: "", download: "", clicked: false };
        createdLinks.push(linkData);

        Object.defineProperty(link, "href", {
          set: (v) => (linkData.href = v),
          get: () => linkData.href,
        });
        Object.defineProperty(link, "download", {
          set: (v) => (linkData.download = v),
          get: () => linkData.download,
        });
        link.click = () => {
          linkData.clicked = true;
        };
      }
      return element;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should download single file directly when only one path", async () => {
    const wrapper = mount(DownloadButton);
    const button = wrapper.get('button');
    await button.trigger('click');

    expect(createdLinks).toHaveLength(1);
    expect(createdLinks[0].href).toBe("./data/csv/summary_table_deaths_disease.csv");
    expect(createdLinks[0].download).toBe("summary_table_deaths_disease.csv");
    expect(createdLinks[0].clicked).toBe(true);
  });

  it("should download as zip when multiple paths", async () => {
    const appStore = useAppStore();
    appStore.focus = "Middle Africa";

    // Mock fetch for zip download
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("csv,content"),
    } as Response);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const wrapper = mount(DownloadButton);
    const button = wrapper.get('button');
    await button.trigger('click');

    await vi.waitFor(() => {
      expect(createdLinks).toHaveLength(1);
      expect(createdLinks[0].href).toBe("blob:test");
      expect(createdLinks[0].download).toBe("summary_tables.zip");
      expect(createdLinks[0].clicked).toBe(true);
    });
  });

  it("should push error to dataStore.downloadErrors when zip download fails", async () => {
    const appStore = useAppStore();
    const dataStore = useDataStore();
    appStore.focus = "Middle Africa";

    // Mock fetch to fail
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      statusText: "Not Found",
    } as Response);

    const wrapper = mount(DownloadButton);
    const button = wrapper.get('button');
    await button.trigger('click');

    await vi.waitFor(() => {
      expect(dataStore.downloadErrors).toHaveLength(1);
      expect(dataStore.downloadErrors[0].message).toContain("Error downloading summary data");
    });
  });

  it("should clear downloadErrors before starting a new download", async () => {
    const appStore = useAppStore();
    const dataStore = useDataStore();
    appStore.focus = "Middle Africa";

    // Pre-populate with an existing error
    dataStore.downloadErrors = [{ e: new Error("previous error"), message: "previous error" }];

    // Mock fetch to succeed
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("csv,content"),
    } as Response);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const wrapper = mount(DownloadButton);
    const button = wrapper.get('button');
    await button.trigger('click');

    await vi.waitFor(() => {
      expect(dataStore.downloadErrors).toHaveLength(0);
    });
  });
});

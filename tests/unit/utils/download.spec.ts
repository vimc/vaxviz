import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia';

import JSZip from "jszip";
import { downloadAsSingleOrZip } from '@/utils/download';

describe('downloadAsSingleOrZip', () => {
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
    await downloadAsSingleOrZip("./data/csv", ["summary_table_deaths_disease.csv"]);

    expect(createdLinks).toHaveLength(1);
    expect(createdLinks[0].href).toBe("./data/csv/summary_table_deaths_disease.csv");
    expect(createdLinks[0].download).toBe("summary_table_deaths_disease.csv");
    expect(createdLinks[0].clicked).toBe(true);
  });

  it("should download as zip when multiple paths", async () => {
    const zipFileSpy = vi.spyOn(JSZip.prototype, "file");
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("csv,content"),
    } as Response);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    await downloadAsSingleOrZip("./data/csv", ["summary_table_deaths_disease.csv", "summary_table_deaths_disease_subregion.csv"]);

    await vi.waitFor(() => {
      expect(createdLinks).toHaveLength(1);
      expect(createdLinks[0].href).toBe("blob:test");
      expect(createdLinks[0].download).toBe("summary_tables.zip");
      expect(createdLinks[0].clicked).toBe(true);
    });

    expect(zipFileSpy).toHaveBeenCalledWith("summary_table_deaths_disease.csv", "csv,content");
    expect(zipFileSpy).toHaveBeenCalledWith("summary_table_deaths_disease_subregion.csv", "csv,content");
  });

  it("should throw if fetch fails when multiple paths", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    await expect(
      downloadAsSingleOrZip("./data/csv", ["summary_table_deaths_disease.csv", "summary_table_deaths_disease_subregion.csv"])
    ).rejects.toThrow(
      'HTTP 404: Not Found'
    );

    expect(createdLinks).toHaveLength(0);
  });
});

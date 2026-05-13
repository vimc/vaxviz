import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia';
import JSZip from "jszip";
import * as analyticsModule from '@/utils/analytics';
import { downloadCsvAsSingleOrZip } from '@/utils/csvDownload';

const mockTrackDownload = () => {
  return vi.spyOn(analyticsModule, 'trackDownload').mockResolvedValue(undefined);
};

describe('downloadCsvAsSingleOrZip', () => {
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

  it("should download single file directly when only one path, and track downloads by filename", async () => {
    const analyticsSpy = mockTrackDownload();
    await downloadCsvAsSingleOrZip("./data/csv/source", ["summary_table_deaths_disease.csv"], "name.zip");

    expect(createdLinks).toHaveLength(1);
    expect(createdLinks[0].href).toBe("./data/csv/source/summary_table_deaths_disease.csv");
    expect(createdLinks[0].download).toBe("summary_table_deaths_disease.csv");
    expect(createdLinks[0].clicked).toBe(true);

    expect(analyticsSpy).toHaveBeenCalledWith("summary_table_by_filename", {
      filenames: ["summary_table_deaths_disease.csv"]
    });
  });

  it("should download single file directly when only one path, and track downloads by location", async () => {
    const analyticsSpy = mockTrackDownload();
    await downloadCsvAsSingleOrZip("./data/csv/source", ["summary_table_deaths_disease.csv"], "name.zip", ["Testland"]);

    expect(createdLinks).toHaveLength(1);
    expect(createdLinks[0].href).toBe("./data/csv/source/summary_table_deaths_disease.csv");
    expect(createdLinks[0].download).toBe("summary_table_deaths_disease.csv");
    expect(createdLinks[0].clicked).toBe(true);

    expect(analyticsSpy).toHaveBeenCalledWith("summary_table_by_location", {
      locations: ["Testland"],
      filenames: ["summary_table_deaths_disease.csv"],
    });
  });

  it("should throw if fetch fails when only one path", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    await expect(
      downloadCsvAsSingleOrZip("./data/csv/source", ["summary_table_deaths_disease.csv"], "name.zip")
    ).rejects.toThrow(
      'HTTP 404: Not Found'
    );

    expect(createdLinks).toHaveLength(0);
  });

  it("should throw if no csv found when only one path", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: {
        get: (header: string) => {
          if (header.toLowerCase() === "content-type") {
            return "text/html";
          }
          return null;
        }
      },
    } as Response);

    await expect(
      downloadCsvAsSingleOrZip("./data/csv/source", ["summary_table_deaths_disease.csv"], "name.zip")
    ).rejects.toThrow(
      'File ./data/csv/source/summary_table_deaths_disease.csv is not a CSV file. Content-Type: text/html'
    );

    expect(createdLinks).toHaveLength(0);
  });

  it("should download as zip when multiple paths", async () => {
    const analyticsSpy = mockTrackDownload();
    const zipFileSpy = vi.spyOn(JSZip.prototype, "file");
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("csv,content"),
      headers: {
        get: () => "text/csv",
      },
    } as Response);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    await downloadCsvAsSingleOrZip("./data/csv/source", ["summary_table_deaths_disease.csv", "summary_table_deaths_disease_subregion.csv"], "name.zip");

    await vi.waitFor(() => {
      expect(createdLinks).toHaveLength(1);
      expect(createdLinks[0].href).toBe("blob:test");
      expect(createdLinks[0].download).toBe("name.zip");
      expect(createdLinks[0].clicked).toBe(true);
    });

    expect(zipFileSpy).toHaveBeenCalledWith("summary_table_deaths_disease.csv", "csv,content");
    expect(zipFileSpy).toHaveBeenCalledWith("summary_table_deaths_disease_subregion.csv", "csv,content");

    expect(analyticsSpy).toHaveBeenCalledWith("summary_table_by_filename", {
      filenames: ["summary_table_deaths_disease.csv", "summary_table_deaths_disease_subregion.csv"]
    });
  });

  it("should throw if fetch (HEAD) fails when multiple paths", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    await expect(
      downloadCsvAsSingleOrZip("./data/csv/source", ["summary_table_deaths_disease.csv", "summary_table_deaths_disease_subregion.csv"], "name.zip")
    ).rejects.toThrow(
      'HTTP 404: Not Found'
    );

    expect(createdLinks).toHaveLength(0);
  });

  it("should throw if fetch (GET) fails when multiple paths", async () => {
    vi.spyOn(global, "fetch").mockImplementation((input: RequestInfo, init?: RequestInit) => {
      if (init && init.method === 'HEAD') {
        // Simulate a successful HEAD request
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          headers: {
            get: () => "text/csv",
          },
        } as Response);
      }
      // Simulate a failed fetch for other requests
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response);
    });

    await expect(
      downloadCsvAsSingleOrZip("./data/csv/source", ["summary_table_deaths_disease.csv", "summary_table_deaths_disease_subregion.csv"], "name.zip")
    ).rejects.toThrow(
      'HTTP 404: Not Found'
    );

    expect(createdLinks).toHaveLength(0);
  });

  it("should throw if no csv found when multiple paths", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: {
        get: (header: string) => {
          if (header.toLowerCase() === "content-type") {
            return "text/html";
          }
          return null;
        }
      },
    } as Response);

    await expect(
      downloadCsvAsSingleOrZip("./data/csv/source", ["summary_table_deaths_disease.csv", "summary_table_deaths_disease_subregion.csv"], "name.zip")
    ).rejects.toThrow(
      'File ./data/csv/source/summary_table_deaths_disease.csv is not a CSV file. Content-Type: text/html'
    );

    expect(createdLinks).toHaveLength(0);
  });
});

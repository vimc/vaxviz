import { createPinia, setActivePinia } from "pinia";
import { it, expect, describe, beforeEach, afterEach, vi } from "vitest";
import { useAppStore } from "@/stores/appStore";
import { useSummaryDownload } from "@/composables/useSummaryDownload";

// Helper to setup pinia and return stores/composable
const setupTest = () => {
  setActivePinia(createPinia());
  const appStore = useAppStore();
  const { summaryTablePaths, downloadSummaryTables } = useSummaryDownload();
  return { appStore, summaryTablePaths, downloadSummaryTables };
};

describe("useSummaryDownload", () => {
  describe("downloadSummaryTables", () => {
    let originalCreateElement: typeof document.createElement;
    let createdLinks: { href: string; download: string; clicked: boolean }[];

    beforeEach(() => {
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
      const { downloadSummaryTables } = setupTest();

      await downloadSummaryTables();

      expect(createdLinks).toHaveLength(1);
      expect(createdLinks[0].href).toBe("./data/csv/summary_table_deaths_disease.csv");
      expect(createdLinks[0].download).toBe("summary_table_deaths_disease.csv");
      expect(createdLinks[0].clicked).toBe(true);
    });

    it("should download as zip when multiple paths", async () => {
      const { appStore, downloadSummaryTables } = setupTest();
      appStore.focus = "Middle Africa";

      // Mock fetch for zip download
      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("csv,content"),
      } as Response);
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

      await downloadSummaryTables();

      expect(createdLinks).toHaveLength(1);
      expect(createdLinks[0].href).toBe("blob:test");
      expect(createdLinks[0].download).toBe("summary_tables.zip");
      expect(createdLinks[0].clicked).toBe(true);
    });
  });
});

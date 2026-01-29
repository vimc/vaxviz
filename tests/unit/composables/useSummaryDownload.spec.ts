import { createPinia, setActivePinia } from "pinia";
import { it, expect, describe, beforeEach, afterEach, vi } from "vitest";
import { nextTick } from "vue";
import { useAppStore } from "@/stores/appStore";
import { useSummaryDownload } from "@/composables/useSummaryDownload";
import { BurdenMetrics, Dimensions } from "@/types";
import fs from "fs";
import path from "path";

// Helper to verify file exists in public/data/csv
const assertFileExists = (filename: string) => {
  const filePath = path.join(process.cwd(), "public/data/csv", filename);
  expect(fs.existsSync(filePath), `File ${filename} should exist`).toBe(true);
};

// Helper to setup pinia and return stores/composable
const setupTest = () => {
  setActivePinia(createPinia());
  const appStore = useAppStore();
  const { summaryTablePaths, downloadSummaryTables } = useSummaryDownload();
  return { appStore, summaryTablePaths, downloadSummaryTables };
};

describe("useSummaryDownload", () => {
  describe("summaryTablePaths", () => {
    it("should return correct path for global view with default settings", () => {
      const { appStore, summaryTablePaths } = setupTest();
      expect(appStore.focus).toBe("global");
      expect(appStore.burdenMetric).toBe(BurdenMetrics.DEATHS);

      expect(summaryTablePaths.value).toHaveLength(1);
      expect(summaryTablePaths.value[0]).toBe("summary_table_deaths_disease.csv");
      assertFileExists(summaryTablePaths.value[0]);
    });

    it("should return correct path when burdenMetric is DALYs", () => {
      const { appStore, summaryTablePaths } = setupTest();
      appStore.burdenMetric = BurdenMetrics.DALYS;

      expect(summaryTablePaths.value).toHaveLength(1);
      expect(summaryTablePaths.value[0]).toBe("summary_table_dalys_disease.csv");
      assertFileExists(summaryTablePaths.value[0]);
    });

    it("should return correct path when splitByActivityType is enabled", async () => {
      const { appStore, summaryTablePaths } = setupTest();
      appStore.splitByActivityType = true;
      await nextTick();

      expect(summaryTablePaths.value).toHaveLength(1);
      expect(summaryTablePaths.value[0]).toBe("summary_table_deaths_disease_activity_type.csv");
      assertFileExists(summaryTablePaths.value[0]);
    });

    it("should return correct paths for subregion focus", () => {
      const { appStore, summaryTablePaths } = setupTest();
      appStore.focus = "Middle Africa";

      expect(summaryTablePaths.value).toHaveLength(2);
      expect(summaryTablePaths.value[0]).toBe("summary_table_deaths_disease_subregion.csv");
      expect(summaryTablePaths.value[1]).toBe("summary_table_deaths_disease.csv");
      assertFileExists(summaryTablePaths.value[0]);
      assertFileExists(summaryTablePaths.value[1]);
    });

    it("should return correct paths for country focus", () => {
      const { appStore, summaryTablePaths } = setupTest();
      appStore.focus = "AFG";

      expect(summaryTablePaths.value).toHaveLength(3);
      expect(summaryTablePaths.value[0]).toBe("summary_table_deaths_disease_country.csv");
      expect(summaryTablePaths.value[1]).toBe("summary_table_deaths_disease_subregion.csv");
      expect(summaryTablePaths.value[2]).toBe("summary_table_deaths_disease.csv");
      assertFileExists(summaryTablePaths.value[0]);
      assertFileExists(summaryTablePaths.value[1]);
      assertFileExists(summaryTablePaths.value[2]);
    });

    it("should return correct paths for disease exploreBy", () => {
      const { appStore, summaryTablePaths } = setupTest();
      appStore.exploreBy = Dimensions.DISEASE;

      expect(summaryTablePaths.value).toHaveLength(2);
      expect(summaryTablePaths.value[0]).toBe("summary_table_deaths_disease_subregion.csv");
      expect(summaryTablePaths.value[1]).toBe("summary_table_deaths_disease.csv");
      assertFileExists(summaryTablePaths.value[0]);
      assertFileExists(summaryTablePaths.value[1]);
    });

    it("should return correct paths with all options combined (country focus, DALYs, activity type)", async () => {
      const { appStore, summaryTablePaths } = setupTest();
      appStore.focus = "AFG";
      appStore.burdenMetric = BurdenMetrics.DALYS;
      appStore.splitByActivityType = true;
      await nextTick();

      expect(summaryTablePaths.value).toHaveLength(3);
      expect(summaryTablePaths.value[0]).toBe("summary_table_dalys_disease_activity_type_country.csv");
      expect(summaryTablePaths.value[1]).toBe("summary_table_dalys_disease_subregion_activity_type.csv");
      expect(summaryTablePaths.value[2]).toBe("summary_table_dalys_disease_activity_type.csv");
      assertFileExists(summaryTablePaths.value[0]);
      assertFileExists(summaryTablePaths.value[1]);
      assertFileExists(summaryTablePaths.value[2]);
    });
  });

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

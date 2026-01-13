import { createPinia, setActivePinia } from "pinia";
import { it, expect, describe, beforeEach, vi } from "vitest";
import { nextTick } from "vue";
import { useAppStore } from "@/stores/appStore";
import {
  useSummaryDownload,
  csvDataDir,
} from "@/composables/useSummaryDownload";
import { BurdenMetrics, Dimensions } from "@/types";

describe("useSummaryDownload", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("summaryTablePaths", () => {
    it("should return correct path for global view with default settings", () => {
      const appStore = useAppStore();
      // Default: exploreBy = location, focus = global, burdenMetric = deaths, logScaleEnabled = true, splitByActivityType = false
      expect(appStore.focus).toBe("global");
      expect(appStore.burdenMetric).toBe(BurdenMetrics.DEATHS);

      const { summaryTablePaths } = useSummaryDownload();

      expect(summaryTablePaths.value).toEqual([
        "summary_table_deaths_disease.csv",
      ]);
    });

    it("should return correct path when burdenMetric is DALYs", () => {
      const appStore = useAppStore();
      appStore.burdenMetric = BurdenMetrics.DALYS;

      const { summaryTablePaths } = useSummaryDownload();

      expect(summaryTablePaths.value).toEqual([
        "summary_table_dalys_disease.csv",
      ]);
    });

    it("should return correct path when splitByActivityType is enabled", async () => {
      const appStore = useAppStore();
      appStore.splitByActivityType = true;
      await nextTick(); // Wait for watcher to update columnDimension

      const { summaryTablePaths } = useSummaryDownload();

      expect(summaryTablePaths.value).toEqual([
        "summary_table_deaths_disease_activity_type.csv",
      ]);
    });

    it("should return correct paths for subregion focus", () => {
      const appStore = useAppStore();
      appStore.focus = "Middle Africa";

      const { summaryTablePaths } = useSummaryDownload();

      // Subregion focus should return paths for both subregion and global data
      expect(summaryTablePaths.value).toEqual([
        "summary_table_deaths_disease_subregion.csv",
        "summary_table_deaths_disease.csv",
      ]);
    });

    it("should return correct paths for country focus", () => {
      const appStore = useAppStore();
      appStore.focus = "AFG"; // Afghanistan

      const { summaryTablePaths } = useSummaryDownload();

      // Country focus should return paths for country, subregion, and global data
      expect(summaryTablePaths.value).toEqual([
        "summary_table_deaths_disease_country.csv",
        "summary_table_deaths_disease_subregion.csv",
        "summary_table_deaths_disease.csv",
      ]);
    });

    it("should return correct paths for disease exploreBy", () => {
      const appStore = useAppStore();
      appStore.exploreBy = Dimensions.DISEASE;
      // When exploreBy changes to disease, focus auto-changes to first disease

      const { summaryTablePaths } = useSummaryDownload();

      // Disease exploration returns subregion and global data
      expect(summaryTablePaths.value).toEqual([
        "summary_table_deaths_disease_subregion.csv",
        "summary_table_deaths_disease.csv",
      ]);
    });

    it("should return correct paths with all options combined (country focus, DALYs, activity type)", async () => {
      const appStore = useAppStore();
      appStore.focus = "AFG";
      appStore.burdenMetric = BurdenMetrics.DALYS;
      appStore.splitByActivityType = true;
      await nextTick(); // Wait for watcher to update columnDimension

      const { summaryTablePaths } = useSummaryDownload();

      expect(summaryTablePaths.value).toEqual([
        "summary_table_dalys_disease_activity_type_country.csv",
        "summary_table_dalys_disease_subregion_activity_type.csv",
        "summary_table_dalys_disease_activity_type.csv",
      ]);
    });

    it("should not include log in the path regardless of logScaleEnabled setting", () => {
      const appStore = useAppStore();
      appStore.logScaleEnabled = true;

      const { summaryTablePaths } = useSummaryDownload();

      // Log scale is for histogram binning only, not summary data
      expect(summaryTablePaths.value[0]).not.toContain("log");
    });
  });

  describe("downloadSummaryData", () => {
    it("should create download links for each path and trigger click", () => {
      const appStore = useAppStore();
      appStore.focus = "Middle Africa";

      const { downloadSummaryData, summaryTablePaths } = useSummaryDownload();

      // Track created elements and their properties
      const createdLinks: { href: string; download: string; clicked: boolean }[] =
        [];

      // Store original createElement to use in mock
      const originalCreateElement = document.createElement.bind(document);

      const createElementSpy = vi
        .spyOn(document, "createElement")
        .mockImplementation((tagName: string) => {
          const element = originalCreateElement(tagName);
          if (tagName === "a") {
            const link = element as HTMLAnchorElement;
            const linkData = { href: "", download: "", clicked: false };
            createdLinks.push(linkData);

            // Override properties to track values
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

      downloadSummaryData();

      // Should create a link for each path
      expect(createElementSpy).toHaveBeenCalledTimes(
        summaryTablePaths.value.length,
      );
      expect(createdLinks.length).toBe(summaryTablePaths.value.length);

      // Verify each link was properly configured and clicked
      createdLinks.forEach((linkData, i) => {
        expect(linkData.href).toBe(`${csvDataDir}/${summaryTablePaths.value[i]}`);
        expect(linkData.download).toBe(summaryTablePaths.value[i]);
        expect(linkData.clicked).toBe(true);
      });

      // Cleanup
      createElementSpy.mockRestore();
    });
  });
});

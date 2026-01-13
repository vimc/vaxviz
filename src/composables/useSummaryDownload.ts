import { computed } from "vue";
import { useAppStore } from "@/stores/appStore";
import { Dimensions, LocResolutions } from "@/types";

export const csvDataDir = `./data/csv`;

export const useSummaryDownload = () => {
  const appStore = useAppStore();

  const summaryTablePaths = computed(() => {
    // Generate paths for summary table CSVs based on current view settings.
    // Similar logic to histogramDataPaths but:
    // - Prefix is 'summary_table_' instead of 'hist_counts_'
    // - No 'log' suffix (log scale is for histogram binning only)
    // - File extension is '.csv' instead of '.json'
    return appStore.geographicalResolutions.map((geog) => {
      const fileNameParts = ["summary_table", appStore.burdenMetric, "disease"];
      if (geog === LocResolutions.SUBREGION) {
        fileNameParts.push(LocResolutions.SUBREGION);
      }
      if (Object.values(appStore.dimensions).includes(Dimensions.ACTIVITY_TYPE)) {
        fileNameParts.push(Dimensions.ACTIVITY_TYPE);
      }
      if (geog === LocResolutions.COUNTRY) {
        fileNameParts.push(LocResolutions.COUNTRY);
      }
      return `${fileNameParts.join("_")}.csv`;
    });
  });

  const downloadSummaryData = () => {
    summaryTablePaths.value.forEach((path) => {
      const link = document.createElement("a");
      link.href = `${csvDataDir}/${path}`;
      link.download = path;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return { summaryTablePaths, downloadSummaryData };
};

import { debounce } from "perfect-debounce";
import { computed, ref, shallowRef, watch } from "vue";
import { defineStore } from "pinia";
import { useAppStore } from "@/stores/appStore";
import { type HistDataRow, type SummaryTableDataRow, Dimension, LocResolution } from "@/types";
import { globalOption } from "@/utils/options";

export const dataDir = `./data/json`

export const useDataStore = defineStore("data", () => {
  const appStore = useAppStore();

  const fetchErrors = ref<{ e: Error, message: string }[]>([]);
  const histogramData = shallowRef<HistDataRow[]>([]);
  const histogramDataCache: Record<string, HistDataRow[]> = {};
  const summaryTableData = shallowRef<SummaryTableDataRow[]>([]);
  const summaryTableDataCache: Record<string, SummaryTableDataRow[]> = {};

  const constructFilenames = (options: {
    dataType: "hist_counts",
    includeScale: true,
  } | {
    dataType: "summary_table",
    includeScale: false, // Log scale is not applicable for summary tables, so does not appear in the filenames.
  }): string[] => {
    return appStore.geographicalResolutions.map((geog) => {
      const fileNameParts = [options.dataType, appStore.burdenMetric, "disease"];
      // NB files containing 'global' data simply omit location from the file name (as they have no location stratification).
      if (geog === LocResolution.SUBREGION) {
        fileNameParts.push(LocResolution.SUBREGION);
      }
      if (Object.values(appStore.dimensions).includes(Dimension.ACTIVITY_TYPE)) {
        fileNameParts.push(Dimension.ACTIVITY_TYPE);
      }
      if (geog === LocResolution.COUNTRY) {
        fileNameParts.push(LocResolution.COUNTRY);
      }
      if (options.includeScale && appStore.logScaleEnabled) {
        fileNameParts.push("log");
      }
      return `${fileNameParts.join("_")}.json`;
    });
  }

  const histogramDataFilenames = computed(() => constructFilenames({
    dataType: "hist_counts",
    includeScale: true,
  }));

  const summaryTableFilenames = computed(() => constructFilenames({
    dataType: "summary_table",
    includeScale: false,
  }));

  // Fetch and parse multiple JSONs, and merge together all data.
  const loadHistogramData = async (filenames: string[]) => {
    fetchErrors.value = [];
    // When we are using multiple geographical resolutions, we load multiple data files, to be merged together later.
    await Promise.all(filenames.map(async (filename) => {
      if (!histogramDataCache[filename]) {
        const path = `${dataDir}/${filename}`;
        try {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const rows = await response.json();
          histogramDataCache[filename] = rows;
          return rows;
        } catch (error) {
          fetchErrors.value.push({ e: error as Error, message: `Error loading data from path: ${path}. ${error}` });
        }
      }
    }));

    // Merge data fetched from multiple files into one array.
    histogramData.value = filenames.flatMap((filename) => histogramDataCache[filename] || []).map((row) => {
      // Collapse all geographic columns into one 'location' column
      const [country, subregion] = [row[LocResolution.COUNTRY], row[LocResolution.SUBREGION]];
      if (country) {
        row[Dimension.LOCATION] = country;
        delete row[LocResolution.COUNTRY];
      } else if (subregion) {
        row[Dimension.LOCATION] = subregion;
        delete row[LocResolution.SUBREGION];
      } else {
        row[Dimension.LOCATION] = globalOption.value;
      }
      return row;
    });
  };

  // Fetch and parse multiple JSONs, and merge together all data.
  const loadSummaryTableData = async (filenames: string[]) => {
    fetchErrors.value = [];
    // When we are using multiple geographical resolutions, we load multiple data files, to be merged together later.
    await Promise.all(filenames.map(async (filename) => {
      if (!summaryTableDataCache[filename]) {
        const path = `${dataDir}/${filename}`;
        try {
          const response = await fetch(`${dataDir}/${filename}`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const rows = await response.json();
          summaryTableDataCache[filename] = rows;
          return rows;
        } catch (error) {
          fetchErrors.value.push({ e: error as Error, message: `Error loading data from path: ${path}. ${error}` });
        }
      }
    }));

    // Merge data fetched from multiple files into one array.
    summaryTableData.value = filenames.flatMap((filename) => summaryTableDataCache[filename] || []).map((row) => {
      // Collapse all geographic columns into one 'location' column
      const [country, subregion] = [row[LocResolution.COUNTRY], row[LocResolution.SUBREGION]];
      if (country) {
        row[Dimension.LOCATION] = country;
        delete row[LocResolution.COUNTRY];
      } else if (subregion) {
        row[Dimension.LOCATION] = subregion;
        delete row[LocResolution.SUBREGION];
      } else {
        row[Dimension.LOCATION] = globalOption.value;
      }
      return row;
    });
  };

  const debouncedLoadHistogramData = debounce(async () => {
    await loadHistogramData(histogramDataFilenames.value);
  }, 25)

  const debouncedLoadSummaryTableData = debounce(async () => {
    await loadSummaryTableData(summaryTableFilenames.value);
  }, 25)

  watch(summaryTableFilenames, async (_oldPaths, newPaths) => {
    if (newPaths) {
      debouncedLoadSummaryTableData();
    } else {
      // This is the first time summaryTablePaths is calculated, so don't debounce.
      await loadSummaryTableData(summaryTableFilenames.value);
    }
  }, { immediate: true });

  watch(histogramDataFilenames, async (_oldPaths, newPaths) => {
    if (newPaths) {
      debouncedLoadHistogramData();
    } else {
      // This is the first time histDataPaths is calculated, so don't debounce.
      await loadHistogramData(histogramDataFilenames.value);
    }
  }, { immediate: true });

  return { fetchErrors, histogramData, summaryTableData };
});

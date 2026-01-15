import { debounce } from "perfect-debounce";
import { computed, ref, shallowRef, watch } from "vue";
import { defineStore } from "pinia";
import { useAppStore } from "@/stores/appStore";
import { type HistDataRow, Dimension, LocResolution } from "@/types";

export const dataDir = `./data/json`

export const useDataStore = defineStore("data", () => {
  const appStore = useAppStore();

  const fetchErrors = ref<{ e: Error, message: string }[]>([]);
  const histogramData = shallowRef<HistDataRow[]>([]);
  const histogramDataCache: Record<string, HistDataRow[]> = {};

  const constructFilenames = (options: {
    dataType: "hist_counts",
    extension: "json",
    includeScale: true,
  } | {
    dataType: "summary_table",
    extension: "csv",
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
      return `${fileNameParts.join("_")}.${options.extension}`
    });
  }

  // When we are using multiple geographical resolutions, we need to load multiple data files, to be merged together later.
  const histogramDataFilenames = computed(() => constructFilenames({ dataType: "hist_counts", extension: "json", includeScale: true }));

  // Generate paths for summary table CSVs based on current plot control selections.
  const summaryTableFilenames = computed(() => constructFilenames({ dataType: "summary_table", extension: "csv", includeScale: false }));

  // Fetch and parse multiple JSONs, and merge together all data.
  const loadDataFromPaths = async (paths: string[]) => {
    fetchErrors.value = [];
    await Promise.all(paths.map(async (path) => {
      if (!histogramDataCache[path]) {
        try {
          const response = await fetch(`${dataDir}/${path}`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const rows = await response.json();
          histogramDataCache[path] = rows;
          return rows;
        } catch (error) {
          fetchErrors.value.push({ e: error as Error, message: `Error loading data from path: ${path}. ${error}` });
        }
      }
    }));

    histogramData.value = paths.flatMap((path) => histogramDataCache[path] || []).map((row) => {
      // Collapse all geographic columns into one 'location' column
      if (row[LocResolution.COUNTRY]) {
        row[Dimension.LOCATION] = row[LocResolution.COUNTRY];
        delete row[LocResolution.COUNTRY];
      } else if (row[LocResolution.SUBREGION]) {
        row[Dimension.LOCATION] = row[LocResolution.SUBREGION];
        delete row[LocResolution.SUBREGION];
      }
      return row;
    });
  };

  const doLoadData = debounce(async () => {
    await loadDataFromPaths(histogramDataFilenames.value);
  }, 25)

  watch(histogramDataFilenames, async (_oldPaths, newPaths) => {
    if (newPaths) {
      doLoadData();
    } else {
      // This is the first time histDataPaths is calculated, so don't debounce.
      await loadDataFromPaths(histogramDataFilenames.value);
    }
  }, { immediate: true });

  return { histogramData, fetchErrors, summaryTableFilenames };
});

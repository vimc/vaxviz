import { debounce } from "perfect-debounce";
import { computed, ref, shallowRef, watch } from "vue";
import { defineStore } from "pinia";
import { useAppStore } from "@/stores/appStore";
import { type HistDataRow, Dimensions, LocResolutions } from "@/types";

export const dataDir = `./data/json`

export const useDataStore = defineStore("data", () => {
  const appStore = useAppStore();

  const fetchErrors = ref<{ e: Error, message: string }[]>([]);
  const histogramData = shallowRef<HistDataRow[]>([]);
  const histogramDataCache: Record<string, HistDataRow[]> = {};

  const histogramDataPaths = computed(() => {
    // When we are using multiple geographical resolutions, we need to load multiple data files, to be merged together later.
    return appStore.geographicalResolutions.map((geog) => {
      const fileNameParts = ["hist_counts", appStore.burdenMetric, "disease"];
      // NB files containing 'global' data simply omit location from the file name (as they have no location stratification).
      if (geog === LocResolutions.SUBREGION) {
        fileNameParts.push(LocResolutions.SUBREGION);
      }
      if (Object.values(appStore.dimensions).includes(Dimensions.ACTIVITY_TYPE)) {
        fileNameParts.push(Dimensions.ACTIVITY_TYPE);
      }
      if (geog === LocResolutions.COUNTRY) {
        fileNameParts.push(LocResolutions.COUNTRY);
      }
      if (appStore.logScaleEnabled) {
        fileNameParts.push("log");
      }
      return `${fileNameParts.join("_")}.json`
    });
  });

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
      if (row[LocResolutions.COUNTRY]) {
        row[Dimensions.LOCATION] = row[LocResolutions.COUNTRY];
        delete row[LocResolutions.COUNTRY];
      } else if (row[LocResolutions.SUBREGION]) {
        row[Dimensions.LOCATION] = row[LocResolutions.SUBREGION];
        delete row[LocResolutions.SUBREGION];
      }
      return row;
    });
  };

  const doLoadData = debounce(async () => {
    await loadDataFromPaths(histogramDataPaths.value);
  }, 25)

  watch(histogramDataPaths, async (_oldPaths, newPaths) => {
    if (newPaths) {
      doLoadData();
    } else {
      // This is the first time histDataPaths is calculated, so don't debounce.
      await loadDataFromPaths(histogramDataPaths.value);
    }
  }, { immediate: true });

  return { histogramData, fetchErrors };
});

import { useAppStore } from "@/stores/appStore";
import { type DataRow, Dimensions, LocResolutions } from "@/types";
import { debounce } from "perfect-debounce";
import { computed, ref, shallowRef, watch } from "vue";

import countryOptions from '@/data/options/countryOptions.json';
import subregionOptions from '@/data/options/subregionOptions.json';
export const dataDir = `/data/json`

export default () => {
  const appStore = useAppStore();

  const fetchErrors = ref<{ e: Error, message: string }[]>([]);
  const histogramData = ref<DataRow[]>([]);
  const histogramDataCache = shallowRef<Record<string, DataRow[]>>({});

  // The geographical resolutions to use based on current exploreBy and focus selections.
  // This is currently exposed by the composable but that's only for manual testing purposes.
  const geographicalResolutions = computed(() => {
    if (appStore.exploreBy === Dimensions.DISEASE) {
      return [LocResolutions.SUBREGION, LocResolutions.GLOBAL];
    } else {
      if (appStore.focus === LocResolutions.GLOBAL) {
        return [LocResolutions.GLOBAL];
      } else if (subregionOptions.find(o => o.value === appStore.focus)) {
        return [LocResolutions.SUBREGION, LocResolutions.GLOBAL];
      } else if (countryOptions.find(o => o.value === appStore.focus)) {
        return [LocResolutions.COUNTRY, LocResolutions.SUBREGION, LocResolutions.GLOBAL];
      }
      // The following line should never be able to be evaluated, because exploreBy is always either
      // 'disease' or 'location', and the three possible types of location are covered by the branches.
      throw new Error(`Invalid focus selection '${appStore.focus}' for exploreBy '${appStore.exploreBy}'`);
    }
  });

  const histogramDataPaths = computed(() => {
    // When we are using multiple geographical resolutions, we need to load multiple data files, to be merged together later.
    return geographicalResolutions.value.map((geog) => {
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
      if (!histogramDataCache.value[path]) {
        try {
          const response = await fetch(`${dataDir}/${path}`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const rows = await response.json();
          histogramDataCache.value[path] = rows;
          return rows;
        } catch (error) {
          fetchErrors.value.push({ e: error as Error, message: `Error loading data from path: ${path}. ${error}` });
        }
      }
    }));

    histogramData.value = paths.flatMap((path) => histogramDataCache.value[path] || []);
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

  return { histogramData, fetchErrors, geographicalResolutions };
}

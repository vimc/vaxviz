import { useAppStore } from "@/stores/appStore";
import { type DataRow, Dimensions, LocResolutions } from "@/types";
import { debounce } from "perfect-debounce";
import { computed, onUnmounted, ref, shallowRef, watch } from "vue";

import countryOptions from '@/data/options/countryOptions.json';
import subregionOptions from '@/data/options/subregionOptions.json';
export const dataDir = `/data/json`

export default () => {
  const appStore = useAppStore();

  const fetchErrors = ref<{ e: Error, message: string }[]>([]);
  const histogramData = ref<DataRow[]>([]);
  const histogramDataCache = shallowRef<Record<string, DataRow[]>>({});

  // Because some files are very large (up to 20MB), we support preemptive background loading of files.
  // preemptiveControllers tracks the abort controllers, so that these preemptive fetches can be cancelled
  // when we need to prioritize user-requested data loading.
  const preemptiveControllers = new Map<string, AbortController>();

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

  // Cancel all preemptive fetches (call this when user requests specific data)
  const cancelPreemptiveFetches = () => {
    console.error("I AM DOING A CANCEL for each of ", Array.from(preemptiveControllers.keys()));
    preemptiveControllers.forEach((controller) => {
      controller.abort();
    });
    preemptiveControllers.clear();
  };

  // Fetch a single file with optional abort support
  const fetchWithAbort = async (path: string, signal?: AbortSignal): Promise<undefined> => {
    if (histogramDataCache.value[path]) {
      return;
    }

    try {
      const response = await fetch(`${dataDir}/${path}`, { signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const rows = await response.json();
      histogramDataCache.value = { ...histogramDataCache.value, [path]: rows };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Silently ignore cancelled requests
        return;
      }
      fetchErrors.value.push({ e: error as Error, message: `Error loading data from path: ${path}. ${error}` });
    }
  };

  // Fetch and parse multiple JSONs with priority (cancels preemptive fetches first)
  const loadDataFromPaths = async (paths: string[]) => {
    fetchErrors.value = [];
    cancelPreemptiveFetches(); // Cancel background fetches to prioritize user request

    await Promise.all(paths.map((path) => fetchWithAbort(path)));
    histogramData.value = paths.flatMap((path) => histogramDataCache.value[path] || []);
  };

  // Preemptively load files in the background (cancelled when user requests data load)
  const preemptiveLoad = async (paths: string[]) => {
    for (const path of paths) {
      if (histogramDataCache.value[path] || preemptiveControllers.has(path)) {
        continue; // Already cached or already loading
      }

      const controller = new AbortController();
      preemptiveControllers.set(path, controller);

      await fetchWithAbort(path, controller.signal);
      preemptiveControllers.delete(path);
    }
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

  onUnmounted(() => {
    cancelPreemptiveFetches();
  });

  return { histogramData, fetchErrors, geographicalResolutions, preemptiveLoad };
}

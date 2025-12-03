// import { Dimensions, LocResolutions, type DataRow } from "@/types";

import { useAppStore } from "@/stores/appStore";
import { type DataRow, Dimensions, LocResolutions } from "@/types";
import { debounce } from "perfect-debounce";
import { computed, ref, watch } from "vue";

export const dataDir = `/data/json`

// TODO: cacheing strategies, e.g. if the new histDataPaths are a superset of the previous ones, only load the new paths

// Fetch and parse multiple JSONs, and merge together all data,
// collapsing all geography columns (i.e. country/subregion) into one common 'location' column.
const loadDataFromPaths = async (paths: string[]) => {
  const allRows = await Promise.all(paths.map(async (path) => {
    const response = await fetch(`${dataDir}/${path}`);
    const rows = await response.json();
    // rows.forEach((row: DataRow) => {
    //   // Collapse all geoography columns into one 'location' column
    //   if (row[LocResolutions.COUNTRY]) {
    //     row[Dimensions.LOCATION] = row[LocResolutions.COUNTRY];
    //     delete row[LocResolutions.COUNTRY];
    //   } else if (row[LocResolutions.SUBREGION]) {
    //     row[Dimensions.LOCATION] = row[LocResolutions.SUBREGION];
    //     delete row[LocResolutions.SUBREGION];
    //   }
    // });
    return rows;
  })).catch((error) => {
    throw new Error(`Error loading data from paths ${paths.join(", ")}: ${error}`);
  });

  return allRows.flat();
}

export default () => {
  const appStore = useAppStore();

  const histData = ref<DataRow[]>([]);

  const dimensionsInUse = computed(() => Object.values(appStore.dimensions));

  // The geographical resolutions to use based on current exploreBy and focus selections.
  const geographicalResolutions = computed(() => {
    if (!dimensionsInUse.value.includes(Dimensions.LOCATION)) {
      return [LocResolutions.GLOBAL];
    }
    if (appStore.exploreBy === Dimensions.DISEASE) {
      return [LocResolutions.SUBREGION, LocResolutions.GLOBAL];
    }
    if (appStore.exploreBy === Dimensions.LOCATION) {
      if (appStore.focus === LocResolutions.GLOBAL) {
        return [LocResolutions.GLOBAL];
      } else if (appStore.subregionOptions.find(o => o.value === appStore.focus)) {
        return [LocResolutions.SUBREGION, LocResolutions.GLOBAL];
      } else if (appStore.countryOptions.find(o => o.value === appStore.focus)) {
        return [LocResolutions.COUNTRY, LocResolutions.SUBREGION, LocResolutions.GLOBAL];
      }
    }
    return [];
  });

  const histDataPaths = computed(() => {
    // When we are using multiple geographical resolutions, we need to load multiple data files, to be merged together later.
    return geographicalResolutions.value.map((geog) => {
      const fileNameParts = ["hist_counts", appStore.burdenMetric, "disease"];
      // NB files containing 'global' data simply omit location from the file name (as they have no location stratification).
      if (dimensionsInUse.value.includes(Dimensions.LOCATION) && geog === LocResolutions.SUBREGION) {
        fileNameParts.push(LocResolutions.SUBREGION);
      }
      if (dimensionsInUse.value.includes(Dimensions.ACTIVITY_TYPE)) {
        fileNameParts.push(Dimensions.ACTIVITY_TYPE);
      }
      if (dimensionsInUse.value.includes(Dimensions.LOCATION) && geog === LocResolutions.COUNTRY) {
        fileNameParts.push(LocResolutions.COUNTRY);
      }
      if (appStore.logScaleEnabled) {
        fileNameParts.push("log");
      }
      return `${fileNameParts.join("_")}.json`
    });
  });

  const doLoadData = debounce(async () => {
    histData.value = await loadDataFromPaths(histDataPaths.value);
  }, 25)

  watch(histDataPaths, async (_oldPaths, newPaths) => {
    if (newPaths) {
      doLoadData();
    } else {
      // This is the first time histDataPaths has been calculated.
      histData.value = await loadDataFromPaths(histDataPaths.value);
    }
  }, { immediate: true });

  return { histData, geographicalResolutions };
}

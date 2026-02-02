import { debounce } from "perfect-debounce";
import { computed, ref, shallowRef, watch, type ShallowRef } from "vue";
import { defineStore } from "pinia";
import { useAppStore } from "@/stores/appStore";
import { type HistDataRow, type LineMetadata, type SummaryTableDataRow, Axis, Dimension, LocResolution } from "@/types";
import { globalOption } from "@/utils/options";
import { downloadCsvAsSingleOrZip } from "@/utils/csvDownload";
import useZipFilename from "@/composables/useZipFilename";

export const jsonDataDir = `./data/json`
export const csvDataDir = `./data/csv`;

export const useDataStore = defineStore("data", () => {
  const appStore = useAppStore();
  const { constructDownloadZipFilename } = useZipFilename();

  const histogramData = shallowRef<HistDataRow[]>([]);
  const histogramCache: Record<string, HistDataRow[]> = {};
  const summaryTableData = shallowRef<SummaryTableDataRow[]>([]);
  const summaryTableCache: Record<string, SummaryTableDataRow[]> = {};
  const isLoading = ref(true);
  const fetchErrors = ref<{ e: Error, message: string }[]>([]);
  const downloadErrors = ref<{ e: Error, message: string }[]>([]);

  const dataErrors = computed(() => [...fetchErrors.value, ...downloadErrors.value]);

  // Find the summary table row whose values for the plot row and band
  // dimensions (and column, if set) match the values of the (ridgeline or point) metadata
  const getSummaryDataRow = (metadata: LineMetadata) => {
    return summaryTableData.value.find(d => {
      return Object.entries(appStore.dimensions).every(([axis, dim]) => {
        return !dim || d[dim] === metadata?.[axis as Axis];
      });
    });
  };

  // Construct filenames without file extension
  const getInputFilenames = (dataType: "hist_counts" | "summary_table"): string[] => {
    return appStore.geographicalResolutions.map((geog) => {
      const fileNameParts = [dataType, appStore.burdenMetric, "disease"];
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
      if (dataType === "hist_counts" && appStore.logScaleEnabled) {
        // Log scale is not applicable for summary tables, so does not appear in the filenames.
        fileNameParts.push("log");
      }
      return fileNameParts.join("_");
    });
  }

  const histFilenames = computed(() => getInputFilenames("hist_counts"));
  const summaryTableFilenames = computed(() => getInputFilenames("summary_table"));

  const downloadSummaryTables = async () => {
    downloadErrors.value = [];
    const filenames = summaryTableFilenames.value.map((f) => `${f}.csv`);
    const zipFileName = constructDownloadZipFilename(filenames);

    try {
      await downloadCsvAsSingleOrZip(csvDataDir, filenames, zipFileName);
    } catch (error) {
      downloadErrors.value.push({
        e: error as Error,
        message: `Error downloading summary tables: ${filenames.join(", ")}. ${error}`,
      });
    }
  };

  const loadData = async <T extends HistDataRow | SummaryTableDataRow>(
    filenames: string[],
    cache: Record<string, T[]>,
    ref: ShallowRef<T[]>,
  ) => {
    // When we are using multiple geographical resolutions, we load multiple data files, to be merged together later.
    await Promise.all(filenames.map(async (filename) => {
      if (!cache[filename]) {
        const path = `${jsonDataDir}/${filename}.json`;
        try {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const rows = await response.json();
          cache[filename] = rows;
          return rows;
        } catch (error) {
          fetchErrors.value.push({
            e: error as Error,
            message: `Error loading data from path: ${path}. ${error}`,
          });
        }
      }
    }));

    // Merge data fetched from multiple files into one array.
    ref.value = filenames.flatMap((filename) => {
      return (cache[filename] || []) as T[];
    }).map((row) => {
      // Collapse all geographic columns into one 'location' column
      const [country, subregion] = [row[LocResolution.COUNTRY], row[LocResolution.SUBREGION]];
      const newRow = { ...row };
      if (country) {
        newRow[Dimension.LOCATION] = country;
        delete newRow[LocResolution.COUNTRY];
      } else if (subregion) {
        newRow[Dimension.LOCATION] = subregion;
        delete newRow[LocResolution.SUBREGION];
      } else {
        newRow[Dimension.LOCATION] = globalOption.value;
      }
      return newRow;
    });
  };

  const loadAllData = async () => {
    isLoading.value = true;
    fetchErrors.value = [];
    await Promise.all([
      loadData<HistDataRow>(histFilenames.value, histogramCache, histogramData),
      loadData<SummaryTableDataRow>(summaryTableFilenames.value, summaryTableCache, summaryTableData),
    ]);
    isLoading.value = false;
  };

  const debouncedLoadAllData = debounce(async () => {
    await loadAllData();
  }, 25)

  watch([histFilenames, summaryTableFilenames], async (_oldPaths, newPaths) => {
    if (newPaths.length) {
      debouncedLoadAllData();
    } else {
      // This is the first time the filenames are computed, so don't debounce.
      await loadAllData();
    }
  }, { immediate: true });

  watch(summaryTableFilenames, () => {
    // Clear any previous download errors when filenames change
    downloadErrors.value = [];
  })

  return {
    dataErrors,
    downloadSummaryTables,
    isLoading,
    getSummaryDataRow,
    histogramData,
    summaryTableData,
    summaryTableFilenames,
  };
});

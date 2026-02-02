import { useAppStore } from "@/stores/appStore";
import { Axis } from "@/types";
import sortByGeographicalResolution from "@/utils/sortByGeographicalResolution";

export default () => {
  const appStore = useAppStore();

  // Generate zip file name based on the current app state and names of the zippable files
  const constructDownloadZipFilename = (filenames: string[]) => {
    if (filenames.length <= 1) return "";
    return [
      "summary_tables",
      appStore.burdenMetric,
      "disease",
      appStore.dimensions[Axis.COLUMN], // Will be 'activity_type' or null
      ...sortByGeographicalResolution(appStore.geographicalResolutions),
    ]
      .filter(Boolean) // filter out nulls
      .join("_") + ".zip";
  };

  return { constructDownloadZipFilename };
}

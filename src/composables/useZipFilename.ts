import { useAppStore } from "@/stores/appStore";
import { Axis } from "@/types";
import getIndexOfLocResolution from "@/utils/getIndexOfLocResolution";

export default () => {
  const appStore = useAppStore();

  // Generate zip file name based on the current app state and names of the zippable files
  const constructDownloadZipFilename = (filenames: string[]) => {
    if (filenames.length <= 1) return "";

    const geographicalResolutions = appStore.geographicalResolutions.toSorted(((a, b) => {
      return getIndexOfLocResolution(b) - getIndexOfLocResolution(a);
    }));

    return [
      "summary_tables",
      appStore.burdenMetric,
      "disease",
      appStore.dimensions[Axis.COLUMN], // Will be 'activity_type' or null
      ...geographicalResolutions,
    ]
      .filter(Boolean) // filter out nulls
      .join("_") + ".zip";
  };

  return { constructDownloadZipFilename };
}

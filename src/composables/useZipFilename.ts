import { useAppStore } from "@/stores/appStore";
import { Axis, LocResolution } from "@/types";

export default () => {
  const appStore = useAppStore();

  // Generate zip file name based on the current app state and names of the zippable files
  const constructDownloadZipFilename = (filenames: string[]) => {
    if (filenames.length <= 1) return "";

    const geographicalResolutions = appStore.geographicalResolutions.toSorted((a: LocResolution, b: LocResolution) => {
      const [aRank, bRank] = [
        a ? Object.values(LocResolution).indexOf(a) : -1,
        b ? Object.values(LocResolution).indexOf(b) : -1,
      ];
      return bRank - aRank;
    });

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

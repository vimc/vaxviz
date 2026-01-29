import { useAppStore } from "@/stores/appStore";

export default () => {
  const appStore = useAppStore();

  // Generate zip file name based on the current app state and names of the zippable files
  const getZipFileName = (filenames: string[]) => {
    if (filenames.length <= 1) return "";
    return [
      "summary_tables",
      appStore.burdenMetric,
      "disease",
      appStore.dimensions.column,
      ...appStore.geographicalResolutions.toSorted(),
      appStore.logScaleEnabled ? "log" : null,
    ].filter(Boolean).join("_") + ".zip";
  };

  return { getZipFileName };
}

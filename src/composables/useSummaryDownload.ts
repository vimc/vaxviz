import { computed } from "vue";
import JSZip from "jszip";
import { useAppStore } from "@/stores/appStore";
import { Dimensions, LocResolutions } from "@/types";

const dataDir = `./data/csv`;

export const useSummaryDownload = () => {
  const appStore = useAppStore();

  const summaryTablePaths = computed(() => {
    // Generate paths for summary table CSVs based on current plot control selections.
    return appStore.geographicalResolutions.map((geog) => {
      const fileNameParts = ["summary_table", appStore.burdenMetric, "disease"];
      if (geog === LocResolutions.SUBREGION) {
        fileNameParts.push(LocResolutions.SUBREGION);
      }
      if (Object.values(appStore.dimensions).includes(Dimensions.ACTIVITY_TYPE)) {
        fileNameParts.push(Dimensions.ACTIVITY_TYPE);
      }
      if (geog === LocResolutions.COUNTRY) {
        fileNameParts.push(LocResolutions.COUNTRY);
      }
      return `${fileNameParts.join("_")}.csv`;
    });
  });

  const downloadSingleFile = (path: string) => {
    const link = document.createElement("a");
    link.href = `${dataDir}/${path}`;
    link.download = path;
    document.body.appendChild(link);
    // Use try-finally to ensure DOM cleanup even if click() throws
    try {
      link.click();
    } finally {
      document.body.removeChild(link);
    }
  };

  const downloadAsZip = async (paths: string[]) => {
    const zip = new JSZip();
    
    // Fetch all files and add to zip
    await Promise.all(
      paths.map(async (path) => {
        const response = await fetch(`${dataDir}/${path}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
        }
        const content = await response.text();
        zip.file(path, content);
      })
    );

    // Generate and download zip
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "summary_tables.zip";
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const downloadSummaryTables = async () => {
    const paths = summaryTablePaths.value;
    if (paths.length === 1 && paths[0]) {
      downloadSingleFile(paths[0]);
    } else if (paths.length > 1) {
      await downloadAsZip(paths);
    }
  };

  return { summaryTablePaths, downloadSummaryTables };
};

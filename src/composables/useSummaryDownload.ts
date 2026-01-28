import JSZip from "jszip";
import { useDataStore } from "@/stores/dataStore";

const dataDir = `./data/csv`;

export const useSummaryDownload = () => {
  const dataStore = useDataStore();

  const downloadSingleFile = (path: string) => {
    const link = document.createElement("a");
    link.href = `${dataDir}/${path}.csv`;
    link.download = `${path}.csv`;
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
        const response = await fetch(`${dataDir}/${path}.csv`);
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
    const paths = dataStore.summaryTableFilenames;
    if (paths.length === 1 && paths[0]) {
      downloadSingleFile(paths[0]);
    } else if (paths.length > 1) {
      await downloadAsZip(paths);
    }
  };

  return { downloadSummaryTables };
};

import JSZip from "jszip";

const downloadSingleFile = async (dataDir: string, filename: string) => {
  const link = document.createElement("a");
  link.href = `${dataDir}/${filename}`;
  link.download = filename;
  document.body.appendChild(link);
  // Use try-finally to ensure cleanup even if click() throws
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
  }
};

const downloadAsZip = async (
  dataDir: string,
  filenames: string[],
  requireCsvCheck: boolean,
) => {
  const zip = new JSZip();

  // Fetch all files and add to zip
  await Promise.all(
    filenames.map(async (filename) => {
      const response = await fetch(`${dataDir}/${filename}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      // Check for CSV content if required.
      // If there is no csv file at the address, the server still returns a 200/OK with an HTML page.
      if (requireCsvCheck) {
        const contentType = response.headers.get("Content-Type") || "";
        if (!contentType.includes("text/csv") && !contentType.includes("application/csv")) {
          throw new Error(`File ${filename} is not a CSV file. Content-Type: ${contentType}`);
        }
      }
      const content = await response.text();
      zip.file(filename, content);
    })
  );

  // Generate and download zip
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "summary_tables.zip";
  document.body.appendChild(link);
  // Use try-finally to ensure cleanup even if click() throws
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const downloadAsSingleOrZip = async (
  dataDir: string,
  filenames: string[],
  requireCsvCheck: boolean = true,
) => {
  if (filenames.length === 1 && filenames[0]) {
    await downloadSingleFile(dataDir, filenames[0]);
  } else if (filenames.length > 1) {
    await downloadAsZip(dataDir, filenames, requireCsvCheck);
  }
};

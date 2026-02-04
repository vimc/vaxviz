import JSZip from "jszip";

// Make a HEAD request to check if the file exists and is a CSV
const headAndCheckCsv = async (path: string) => {
  const response = await fetch(path, { method: "HEAD" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  // Check for CSV content.
  // If there is no csv file at the address, the server still returns a 200/OK with an HTML page,
  // so we need to check the content-type header.
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.includes("text/csv") && !contentType.includes("application/csv")) {
    throw new Error(`File ${path} is not a CSV file. Content-Type: ${contentType}`);
  }
}

const downloadSingleFile = async (dataDir: string, filename: string) => {
  const filepath = `${dataDir}/${filename}`;
  await headAndCheckCsv(filepath);
  const link = document.createElement("a");
  link.href = filepath;
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
  zipFileName: string,
) => {
  const zip = new JSZip();

  // Fetch all files and add to zip
  await Promise.all(
    filenames.map(async (filename) => {
      await headAndCheckCsv(`${dataDir}/${filename}`);
      const response = await fetch(`${dataDir}/${filename}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
  link.download = zipFileName;
  document.body.appendChild(link);
  // Use try-finally to ensure cleanup even if click() throws
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const downloadCsvAsSingleOrZip = async (
  dataDir: string,
  filenames: string[],
  zipFileName: string,
) => {
  if (filenames.length === 1 && filenames[0]) {
    await downloadSingleFile(dataDir, filenames[0]);
  } else if (filenames.length > 1) {
    await downloadAsZip(dataDir, filenames, zipFileName);
  }
};

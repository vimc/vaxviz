import JSZip from "jszip";

const csvDataDir = `./data/csv`;

const checkIfFileExists = (path: string) => {
  const modules = import.meta.glob('/public/data/csv/*.csv');
  const filePath = `/public/data/csv/${path}.csv`;
  if (!Object.keys(modules).includes(filePath)) {
    throw new Error(`The requested file "${path}.csv" does not exist on the server.`);
  }
};

const downloadSingleFile = async (path: string) => {
  checkIfFileExists(path);
  const link = document.createElement("a");
  link.href = `${csvDataDir}/${path}.csv`;
  link.download = `${path}.csv`;
  document.body.appendChild(link);
  // Use try-finally to ensure cleanup even if click() throws
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
      checkIfFileExists(path);
      const response = await fetch(`${csvDataDir}/${path}.csv`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const content = await response.text();
      zip.file(`${path}.csv`, content);
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

export const downloadAsSingleOrZip = async (paths: string[]) => {
  if (paths.length === 1 && paths[0]) {
    await downloadSingleFile(paths[0]);
  } else if (paths.length > 1) {
    await downloadAsZip(paths);
  }
};

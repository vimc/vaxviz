// This script is not intended to be called directly, but via the scripts/process-csv-data.sh script.
// It splits CSV files containing 'country' or 'subregion' in their filename
// into per-location files.
// These files are stored in nested subfolders, first by resolution (country/subregion) then by location.
import fs from "fs";
import path from "path";

const scriptsDir = import.meta.dirname;
const csvSourceDir = path.join(scriptsDir, "../public/data/csv/source");

const locationTablesDir = path.join(csvSourceDir, "../location_summary_tables");
fs.rmSync(locationTablesDir, { recursive: true, force: true });
fs.mkdirSync(path.join(locationTablesDir, "country_summary_tables"), { recursive: true });
fs.mkdirSync(path.join(locationTablesDir, "subregion_summary_tables"), { recursive: true });

const summaryTableCsvFiles = fs.readdirSync(csvSourceDir).filter((f) => f.endsWith(".csv") && f.startsWith("summary_table"));

for (const filename of summaryTableCsvFiles) {
  const locationType = filename.includes("country")
    ? "country"
    : filename.includes("subregion")
      ? "subregion"
      : null;
  if (!locationType) continue;

  const filepath = path.join(csvSourceDir, filename);
  const content = fs.readFileSync(filepath, "utf8");
  const lines = content.split("\n");
  const header = lines[0];
  const headers = header.split(",").map((h) => h.replace(/"/g, ""));

  const locationColIndex = headers.indexOf(locationType);

  // Group data rows by location value.
  const rowsByLocation: Record<string, string[]> = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const location = line.split(",")[locationColIndex].replace(/"/g, "");
    if (!rowsByLocation[location]) {
      rowsByLocation[location] = [];
    }
    rowsByLocation[location].push(line);
  }

  const basenameNoExt = filename.replace(/\.csv$/, "");
  const typeDir = path.join(locationTablesDir, `${locationType}_summary_tables`);

  for (const [location, rows] of Object.entries(rowsByLocation)) {
    const safeLocation = location.replaceAll(" ", "_");
    const locationDir = path.join(typeDir, `${safeLocation}_summary_tables`);
    fs.mkdirSync(locationDir, { recursive: true });

    const outputFile = path.join(locationDir, `${basenameNoExt}_${safeLocation}.csv`);
    fs.writeFileSync(outputFile, [header, ...rows].join("\n") + "\n");
    console.log(`Split ${filename} -> ${safeLocation} (${rows.length + 1} lines)`);
  }
}

// This script is not intended to be called directly, but via the scripts/convert-csv-files-to-json.sh script.
// It is a pre-build step, using summary tables to generate the options for controls.
import fs from "fs";
import { Dimensions, LocResolutions, type Option, type SummaryTableDataRow } from "../src/types.ts";
import { getCountryName } from "../src/utils/regions.ts";

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error("Usage: node generate-summary-json.js <data-source directory> <`./src/data` sub-directory>");
  process.exit(1);
}
const dataSourceDir = args[0];
const targetDir = args[1];

// NB Some diseases (e.g. Malaria) are included only at the subregional level, hence we need both tables.
const summaryTableDeathsDiseaseCountryJson = dataSourceDir + '/summary_table_deaths_disease_country.json';
const summaryTableDeathsDiseaseSubregionJson = dataSourceDir + '/summary_table_deaths_disease_subregion.json';

const summaryTableDeathsDiseaseCountry: SummaryTableDataRow[] = JSON.parse(fs.readFileSync(summaryTableDeathsDiseaseCountryJson, 'utf8'));
const summaryTableDeathsDiseaseSubregion: SummaryTableDataRow[] = JSON.parse(fs.readFileSync(summaryTableDeathsDiseaseSubregionJson, 'utf8'));

let countryOpts: Option[] = [];
let subregionOpts: Option[] = [];
let diseaseOpts: Option[] = [];
[
  summaryTableDeathsDiseaseCountry,
  summaryTableDeathsDiseaseSubregion,
].map((rows: SummaryTableDataRow[]) => {
  for (const row of rows) {
    const countryValue = row[LocResolutions.COUNTRY]?.toString();
    const subregionValue = row[LocResolutions.SUBREGION]?.toString();
    const diseaseValue = row[Dimensions.DISEASE].toString();
    if (countryValue && !countryOpts.find(o => o.value === countryValue)) {
      countryOpts.push({
        value: countryValue,
        label: getCountryName(countryValue) ?? countryValue
      });
    } else if (subregionValue && !subregionOpts.find(o => o.value === subregionValue)) {
      subregionOpts.push({
        value: subregionValue,
        label: subregionValue
      });
    }
    if (diseaseValue && !diseaseOpts.find(o => o.value === diseaseValue)) {
      diseaseOpts.push({
        value: diseaseValue,
        label: diseaseValue
      });
    }
  }
});

// Sort options alphabetically by label.
countryOpts = countryOpts.sort((a, b) => a.label.localeCompare(b.label));
subregionOpts = subregionOpts.sort((a, b) => a.label.localeCompare(b.label));
diseaseOpts = diseaseOpts.sort((a, b) => a.label.localeCompare(b.label));

// Write options into target directory as JSON files.
fs.writeFileSync(`${targetDir}/countryOptions.json`, JSON.stringify(countryOpts, null, 2));
fs.writeFileSync(`${targetDir}/subregionOptions.json`, JSON.stringify(subregionOpts, null, 2));
fs.writeFileSync(`${targetDir}/diseaseOptions.json`, JSON.stringify(diseaseOpts, null, 2));

console.log(`Generated options JSON files in ${targetDir}`);

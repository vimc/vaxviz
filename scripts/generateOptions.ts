// This script is not intended to be called directly, but via the scripts/convert-csv-files-to-json.sh script.
// It is a pre-build step, using summary tables to generate the options for controls.
import fs from "fs";
import { Dimensions, LocResolutions, type Option, type SummaryTableDataRow } from "../src/types.ts";
import { getCountryName } from "../src/utils/regions.ts";
import titleCase from "../src/utils/titleCase.ts";

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error("Usage: node generateOptions.ts <data-source directory> <`./src/data` sub-directory>");
  process.exit(1);
}
const dataSourceDir = args[0];
const targetDir = args[1];

// Some diseases (e.g. Malaria) are included only at the subregional or the country level,
// hence we need tables at both country and subregional levels in order to collect all disease options.
// There are also some diseases (e.g. MenA) that are only included in tables that have an activity_type breakdown,
// so we need to include those tables too.
// All four permutations are required, since at least one disease (Meningitis) is picky about both those factors.
const summaryTableDeathsDiseaseCountryJson = dataSourceDir + '/summary_table_deaths_disease_country.json';
const summaryTableDeathsDiseaseSubregionJson = dataSourceDir + '/summary_table_deaths_disease_subregion.json';
const summaryTableDeathsDiseaseCountryActivityTypeJson = dataSourceDir + '/summary_table_deaths_disease_activity_type_country.json';
const summaryTableDeathsDiseaseSubregionActivityTypeJson = dataSourceDir + '/summary_table_deaths_disease_subregion_activity_type.json';

const summaryTableDeathsDiseaseCountry: SummaryTableDataRow[] = JSON.parse(
  fs.readFileSync(summaryTableDeathsDiseaseCountryJson, 'utf8')
);
const summaryTableDeathsDiseaseSubregion: SummaryTableDataRow[] = JSON.parse(
  fs.readFileSync(summaryTableDeathsDiseaseSubregionJson, 'utf8')
);
const summaryTableDeathsDiseaseCountryActivityType: SummaryTableDataRow[] = JSON.parse(
  fs.readFileSync(summaryTableDeathsDiseaseCountryActivityTypeJson, 'utf8')
);
const summaryTableDeathsDiseaseSubregionActivityType: SummaryTableDataRow[] = JSON.parse(
  fs.readFileSync(summaryTableDeathsDiseaseSubregionActivityTypeJson, 'utf8')
);

let countryOpts: Option[] = [];
let subregionOpts: Option[] = [];
let diseaseOpts: Option[] = [];
let activityTypeOpts: Option[] = [];
[
  summaryTableDeathsDiseaseCountry,
  summaryTableDeathsDiseaseSubregion,
  summaryTableDeathsDiseaseCountryActivityType,
  summaryTableDeathsDiseaseSubregionActivityType
].map((rows: SummaryTableDataRow[]) => {
  for (const row of rows) {
    const countryValue = row[LocResolutions.COUNTRY]?.toString();
    const subregionValue = row[LocResolutions.SUBREGION]?.toString();
    const diseaseValue = row[Dimensions.DISEASE].toString();
    const activityTypeValue = row[Dimensions.ACTIVITY_TYPE]?.toString();
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
    if (activityTypeValue && !activityTypeOpts.find(o => o.value === activityTypeValue)) {
      activityTypeOpts.push({
        value: activityTypeValue,
        label: titleCase(activityTypeValue)
      });
    }
  }
});

// Sort options alphabetically by label.
countryOpts = countryOpts.sort((a, b) => a.label.localeCompare(b.label));
subregionOpts = subregionOpts.sort((a, b) => a.label.localeCompare(b.label));
diseaseOpts = diseaseOpts.sort((a, b) => a.label.localeCompare(b.label));
activityTypeOpts = activityTypeOpts.sort((a, b) => a.label.localeCompare(b.label));

// Helper function to write options as JSON files.
function writeJson(filename: string, options: Option[]) {
  fs.writeFileSync(`${targetDir}/${filename}`, JSON.stringify(options, null, 2));
}

// Write options into target directory as JSON files.
writeJson('countryOptions.json', countryOpts);
writeJson('subregionOptions.json', subregionOpts);
writeJson('diseaseOptions.json', diseaseOpts);
writeJson('activityTypeOptions.json', activityTypeOpts);

console.log(`Generated options JSON files in ${targetDir}`);

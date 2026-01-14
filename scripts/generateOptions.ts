// This script is not intended to be called directly, but via the scripts/convert-csv-files-to-json.sh script.
// It is a pre-build step, using summary tables to generate the options for controls.
import fs from "fs";
import { Dimension, LocResolution, type Option, type SummaryTableDataRow } from "../src/types.ts";
import { getCountryName } from "../src/utils/regions.ts";
import titleCase from "../src/utils/titleCase.ts";

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error("Usage: node generateOptions.ts <data-source directory> <`./src/data` sub-directory>");
  process.exit(1);
}
const dataSourceDir = args[0];
const targetDir = args[1];

let countryOpts: Option[] = [];
let subregionOpts: Option[] = [];
let diseaseOpts: Option[] = [];
let activityTypeOpts: Option[] = [];

// Some diseases (e.g. Malaria) are included only at the subregional or the country level,
// hence we need tables at both country and subregional levels in order to collect all disease options.
// There are also some diseases (e.g. MenA) that are only included in tables that have an activity_type breakdown,
// so we need to include those tables too.
// All four permutations are required, since at least one disease (Meningitis) is picky about both those factors.
[
  `summary_table_deaths_disease_country.json`,
  `summary_table_deaths_disease_subregion.json`,
  `summary_table_deaths_disease_activity_type_country.json`,
  `summary_table_deaths_disease_subregion_activity_type.json`
].map((filename: string) => {
  const rows: SummaryTableDataRow[] = JSON.parse(
    fs.readFileSync(`${dataSourceDir}/${filename}`, 'utf8')
  );
  for (const row of rows) {
    const countryValue = row[LocResolution.COUNTRY]?.toString();
    const subregionValue = row[LocResolution.SUBREGION]?.toString();
    const diseaseValue = row[Dimension.DISEASE].toString();
    const activityTypeValue = row[Dimension.ACTIVITY_TYPE]?.toString();
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


// TODO: cacheing of JSON processing?

import { Dimensions, LocResolutions, type DataRow } from "@/types";

const packetId = "20251114-115928-130babc4";
export const dataDir = `/data/${packetId}/json`

// Fetch and parse JSONs from multiple paths,
// and merge together all data from multiple JSONs (collapsing all location columns into one).



// TODO: Why was I using 'sections' here? They don't seem to do anything.

export default async (paths: string[]) => {
  // A 'section' of a data file is the section devoted to some specific permutation of axis values.
  // These are not at all guaranteed to be in any particular order in the JSON files.
  const sections: DataRow[][] = [];
  // Merge together all data from multiple JSONs (collapsing all location columns into one)
  await Promise.all(paths.map(async (path) => {
    const response = await fetch(`${dataDir}/${path}`);
    const rows = await response.json();
    for (const row of rows) {
      const currentSection = sections[sections.length - 1];
      if (currentSection) {
        const prevRow = currentSection[currentSection.length - 2];
        if (!prevRow) {
          currentSection.push(row);
        } else {
          if ((prevRow[Dimensions.LOCATION] === row[Dimensions.LOCATION]
            && prevRow[Dimensions.DISEASE] === row[Dimensions.DISEASE]
            && prevRow[Dimensions.ACTIVITY_TYPE] === row[Dimensions.ACTIVITY_TYPE])) {
            // Same section
            currentSection.push(row);
          } else {
            // New section.
            const newSection = [row];
            sections.push(newSection);
          }
        }
      } else {
        const newSection = [row];
        sections.push(newSection);
      }
    }
  }));

  sections.forEach(section => {
    for (const row of section) {
      // Collapse all location columns into one 'location' column
      if (row[LocResolutions.COUNTRY]) {
        row[Dimensions.LOCATION] = row[LocResolutions.COUNTRY];
        delete row[LocResolutions.COUNTRY];
      } else if (row[LocResolutions.SUBREGION]) {
        row[Dimensions.LOCATION] = row[LocResolutions.SUBREGION];
        delete row[LocResolutions.SUBREGION];
      }
    }
  });

  return sections.flat();
}

import { Dimension, LocResolution } from "@/types";
import { metricOptions } from "@/utils/options";

const getSummaryTableNames = () => {
  const burdenMetrics = metricOptions.map(o => o.value);
  const activityTypes = [Dimension.ACTIVITY_TYPE, ""];
  const geogs = [LocResolution.COUNTRY, LocResolution.SUBREGION, ""];
  const combinations: string[] = [];

  burdenMetrics.forEach((metric) => {
    activityTypes.forEach((activityType) => {
      geogs.forEach((geog) => {
        const fileNameParts = ["summary_table", metric, "disease"];
        if (geog === LocResolution.SUBREGION) {
          fileNameParts.push(LocResolution.SUBREGION);
        }
        fileNameParts.push(activityType);
        if (geog === LocResolution.COUNTRY) {
          fileNameParts.push(LocResolution.COUNTRY);
        }
        const fileName = fileNameParts.filter(p => p !== "").join("_");
        combinations.push(fileName);
      });
    });
  });

  return combinations;
};

export const allPossibleSummaryTables = getSummaryTableNames();

// This file contains hard-coded options.
// Static, automatically-generated options go in src/data/options/.
import { BurdenMetrics, Dimensions, LocResolutions } from "@/types";
import countryOptions from '@/data/options/countryOptions.json';
import diseaseOptions from '@/data/options/diseaseOptions.json';
import subregionOptions from '@/data/options/subregionOptions.json';
import activityTypeOptions from '@/data/options/activityTypeOptions.json';

export const metricOptions = [
  { label: "DALYs averted", value: BurdenMetrics.DALYS },
  { label: "Deaths averted", value: BurdenMetrics.DEATHS },
];

export const exploreOptions = [
  { label: "Disease", value: Dimensions.DISEASE },
  { label: "Geography", value: Dimensions.LOCATION },
];

export const globalOption = {
  label: `All ${countryOptions.length} VIMC countries`,
  value: LocResolutions.GLOBAL as string
};

const locationOptions = countryOptions.concat(subregionOptions).concat([globalOption]);

// Get a data category's human-readable label from its value and dimension.
export const dimensionOptionLabel = (dim: Dimensions, value: string): string => {
  const options = {
    [Dimensions.LOCATION]: locationOptions,
    [Dimensions.DISEASE]: diseaseOptions,
    [Dimensions.ACTIVITY_TYPE]: activityTypeOptions,
  }[dim];

  return options?.find(o => o.value === value)?.label ?? value;
};

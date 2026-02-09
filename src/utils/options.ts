// This file contains hard-coded options.
// Static, automatically-generated options go in src/data/options/.
import { BurdenMetric, Dimension, LocResolution } from "@/types";
import countryOptions from '@/data/options/countryOptions.json';
import diseaseOptions from '@/data/options/diseaseOptions.json';
import subregionOptions from '@/data/options/subregionOptions.json';
import activityTypeOptions from '@/data/options/activityTypeOptions.json';

export const metricOptions = [
  { label: "DALYs averted", value: BurdenMetric.DALYS },
  { label: "Deaths averted", value: BurdenMetric.DEATHS },
];

export const exploreOptions = [
  { label: "Disease", value: Dimension.DISEASE },
  { label: "Geography", value: Dimension.LOCATION },
];

export const globalOption = {
  label: `All ${countryOptions.length} VIMC countries`,
  value: LocResolution.GLOBAL as string
};

const locationOptions = countryOptions.concat(subregionOptions).concat([globalOption]);

// Get a data category's human-readable label from its value and dimension.
export const dimensionOptionLabel = (dim: Dimension | null, value: string): string | undefined => {
  if (!value || !dim) {
    return;
  }
  return {
    [Dimension.LOCATION]: locationOptions,
    [Dimension.DISEASE]: diseaseOptions,
    [Dimension.ACTIVITY_TYPE]: activityTypeOptions,
  }[dim]?.find(o => o.value === value)?.label ?? value
};

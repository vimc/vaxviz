// This file contains hard-coded options.
// Static, automatically-generated options go in src/data/options/.
import { BurdenMetric, Dimension, LocResolution } from "@/types";
import countryOptions from '@/data/options/countryOptions.json';
import diseaseOptions from '@/data/options/diseaseOptions.json';
import subregionOptions from '@/data/options/subregionOptions.json';
import activityTypeOptions from '@/data/options/activityTypeOptions.json';

// Exceptionally, these options which we present as 'disease options' actually refer to vaccines.
// Meningitis itself is included as a disease option.
export const meningitisVaccines = ["MenA", "MenACWYX"];

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

export const locationSelectOptions = [{
  label: "Global",
  options: [globalOption]
}, {
  label: "Subregions",
  options: subregionOptions
}, {
  label: "Countries",
  options: countryOptions
}].map(group => {
  const optgroup = { label: group.label, value: "optgroup", disabled: true };
  return [optgroup, ...group.options];
}).flat();

// This file contains hard-coded options.
// Static, automatically-generated options go in src/data/options/.
import { BurdenMetrics, Dimensions, LocResolutions } from "@/types";
import countryOptions from '@/data/options/countryOptions.json';

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

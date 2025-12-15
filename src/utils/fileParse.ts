import { Dimensions, type HistDataRow } from "../types";
import { globalOption } from "./options";

// Get a data row's category for some categorical axis.
export const getDimensionCategoryValue = (dim: Dimensions | null, dataRow: HistDataRow): string => {
  if (!dim) {
    return "";
  }
  const value = dataRow[dim] as string;
  if (dim === Dimensions.LOCATION && !value) {
    // A missing column for the location dimension implies 'global' category.
    return globalOption.value;
  } else {
    return value;
  }
};

// TODO: Make this function more generic, like, actually-always look up the label.
// TODO: Move to a more relevant file
// Get an data category's human-readable label from its value & dimension.
export const getCategoryLabel = (dim: Dimensions, value: string): string => {
  if (dim === Dimensions.LOCATION && value === globalOption.value) {
    return globalOption.label;
  }
  return value;
};

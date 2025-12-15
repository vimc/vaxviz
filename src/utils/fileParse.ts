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

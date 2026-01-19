import { Dimension, type DataRow } from "../types";
import { globalOption } from "./options";

// Get a data row's category for some categorical axis.
export const getDimensionCategoryValue = (dim: Dimension | null, dataRow: DataRow): string => {
  const value = dataRow[dim ?? ""] as string;
  if (dim === Dimension.LOCATION && !value) {
    // A missing column for the location dimension implies 'global' category.
    return globalOption.value;
  } else {
    return value;
  }
};

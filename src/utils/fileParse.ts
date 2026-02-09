import { Dimension, type HistDataRow } from "../types";
import { globalOption } from "./options";

// Get a data row's category for some categorical axis.
export const getDimensionCategoryValue = (dim: Dimension | null, dataRow: HistDataRow): string => {
  const value = dataRow[dim as keyof HistDataRow] as string;
  if (dim === Dimension.LOCATION && !value) {
    // A missing column for the location dimension implies 'global' category.
    return globalOption.value;
  } else {
    return value;
  }
};

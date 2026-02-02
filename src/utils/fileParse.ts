import { Dimension, type HistDataRow, type SummaryTableDataRow } from "../types";
import { globalOption } from "./options";

// Get a data row's category for some categorical axis.
export const getDimensionCategoryValue = <T extends HistDataRow | SummaryTableDataRow>(
  dim: Dimension | null,
  dataRow: T,
): string => {
  const value = dataRow[dim as keyof T] as string;
  if (dim === Dimension.LOCATION && !value) {
    // A missing column for the location dimension implies 'global' category.
    return globalOption.value;
  } else {
    return value;
  }
};

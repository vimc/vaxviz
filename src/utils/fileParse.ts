import { LocResolutions, type Dimensions, type HistDataRow } from "../types";
import titleCase from "./titleCase";

// Get a data row's category for some categorical axis.
// A missing column for the location dimension implies 'global' category.
export const getDimensionCategory = (dim: Dimensions | null, dataRow: HistDataRow): string => {
  if (!dim) {
    return "";
  }
  return (dataRow[dim] as string) ?? titleCase(LocResolutions.GLOBAL);
};

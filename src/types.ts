import type { Point } from "@reside-ic/skadi-chart";

export enum BurdenMetric {
  DALYS = "dalys",
  DEATHS = "deaths"
}

// Dimensions are ways of data slicing that can be assigned to categorical or colour axes; each will have a filter.
export enum Dimension {
  LOCATION = "location",
  DISEASE = "disease",
  ACTIVITY_TYPE = "activity_type",
}

export enum LocResolution {
  GLOBAL = "global",
  SUBREGION = "subregion",
  COUNTRY = "country",
}

export enum HistColumn {
  LOWER_BOUND = "lower_bound",
  UPPER_BOUND = "upper_bound",
  COUNTS = "Counts",
}

export enum SummaryTableColumn {
  MEAN = "mean_value",
  MEDIAN = "median_value",
  CI_LOWER = "lower_95",
  CI_UPPER = "upper_95",
}

type DataRow = Record<string, string | number> & {
  [Dimension.DISEASE]: string;
  [Dimension.ACTIVITY_TYPE]?: string;
  [LocResolution.COUNTRY]?: string;
  [LocResolution.SUBREGION]?: string;
  [Dimension.LOCATION]?: string;
};
export type HistDataRow = DataRow & Record<HistColumn, number>;
export type SummaryTableDataRow = DataRow & Record<SummaryTableColumn, number>;

export type Option = { label: string; value: string };

export type Coords = { x: number; y: number };

// The column axis corresponds to horizontal splitting of the ridgeline plot, known internally to skadi-chart as the 'x categorical' axis.
// The row axis corresponds to the rows of the ridgeline plot, known internally to skadi-chart as the 'y categorical' axis.
// The 'within-band' axis is often denoted by color. It distinguishes different lines that share the same categorical axis values.
export enum Axis {
  COLUMN = "column",
  ROW = "row",
  WITHIN_BAND = "withinBand",
}

// Metadata associated with each line in a ridgeline plot, which skadi-chart copies onto each line's points.
export type LineMetadata = Record<Axis, string>;

export type PointWithMetadata = Point & { metadata?: LineMetadata };

export type LineColors = {
  fillColor: string | undefined;
  fillOpacity: number;
  strokeColor: string | undefined;
  strokeOpacity: number;
};

import type { Point } from "@reside-ic/skadi-chart";

export enum BurdenMetrics {
  DALYS = "dalys",
  DEATHS = "deaths"
}

// Dimensions are ways of data slicing that can be assigned to categorical or colour axes; each will have a filter.
export enum Dimensions {
  LOCATION = "location",
  DISEASE = "disease",
  ACTIVITY_TYPE = "activity_type",
}

export enum LocResolutions {
  GLOBAL = "global",
  SUBREGION = "subregion",
  COUNTRY = "country",
}

export enum HistCols {
  LOWER_BOUND = "lower_bound",
  UPPER_BOUND = "upper_bound",
  COUNTS = "Counts",
}

type DataRow = Record<string, string | number>;
export type SummaryTableDataRow = DataRow & {
  [Dimensions.DISEASE]: string;
  [LocResolutions.COUNTRY]?: string;
  [LocResolutions.SUBREGION]?: string;
};
export type HistDataRow = DataRow & {
  [Dimensions.DISEASE]: string;
  [LocResolutions.COUNTRY]?: string;
  [LocResolutions.SUBREGION]?: string;
  [Dimensions.LOCATION]?: string;
  [HistCols.LOWER_BOUND]: number;
  [HistCols.UPPER_BOUND]: number;
  [HistCols.COUNTS]: number;
};

export type Option = { label: string; value: string };

export type Coords = { x: number; y: number };

// The column axis corresponds to horizontal splitting of the ridgeline plot, known internally to skadi-chart as the 'x categorical' axis.
// The row axis corresponds to the rows of the ridgeline plot, known internally to skadi-chart as the 'y categorical' axis.
// The 'within-band' axis is often denoted by color. It distinguishes different lines that share the same categorical axis values.
export enum Axes {
  COLUMN = "column",
  ROW = "row",
  WITHIN_BAND = "withinBand",
}

// Metadata associated with each line in a ridgeline plot, which skadi-chart copies onto each line's points.
export type Metadata = Record<Axes, string>;

export type PointWithMetadata = Point & { metadata?: Metadata };

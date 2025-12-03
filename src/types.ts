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

export type DataRow = Record<string, string | number>;
export type SummaryTableDataRow = DataRow & {
  [Dimensions.DISEASE]: string;
  [LocResolutions.COUNTRY]?: string;
  [LocResolutions.SUBREGION]?: string;
};

export type Option = { label: string; value: string };


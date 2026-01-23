import { Dimension, type LineMetadata, SummaryTableColumn, type SummaryTableDataRow } from "@/types";
import { globalOption } from "./options";
import type { Lines, Scales } from "@reside-ic/skadi-chart";
// "Chart" and "types" are modules declared by @reside-ic/skadi-chart
import type { PartialChartOptions } from "Chart";
import type { Bounds, XY } from "types";
import sentenceCase from "./sentenceCase";
import { useDataStore } from "@/stores/dataStore";

const ELLIPSIS = "...";
const Y_TICK_LABEL_MAX_LENGTH = globalOption.label.length;
export const TOOLTIP_RADIUS_PX = 100; // Maximum distance in px from point for triggering tooltips to be displayed

const numericalScales = (logScaleEnabled: boolean, lines: Lines<LineMetadata>): Scales => {
  const maxX = Math.max(...lines.flatMap(l => {
    const lastPoint = l.points[l.points.length - 1]!;
    return lastPoint.x;
  }));
  const maxY = Math.max(...lines.flatMap(l => Math.max(...l.points.map(p => p.y))));
  const minX = Math.min(...lines.flatMap(l => {
    // Take the first point: assume points are sorted by x value.
    const firstPoint = l.points[0]!;
    return firstPoint.x;
  }));

  // x values may be slightly negative for some cases eg Typhoid
  return {
    x: { start: logScaleEnabled ? minX : Math.min(minX, 0), end: maxX },
    y: { start: 0, end: maxY },
  };
};

/**
 * Calculate the mean of means for a given row value across all its ridgelines.
 * @param rowValue The categorical row value (e.g., disease name or location)
 * @param rowDimension The dimension type for the row (disease, location, etc.)
 * @param lines All lines in the plot
 * @param summaryTableData Summary statistics data
 * @returns The mean of the mean values for this row
 */
const calculateMeanOfMeans = (
  rowValue: string,
  rowDimension: Dimension,
  lines: Lines<LineMetadata>,
  summaryTableData: SummaryTableDataRow[]
): number => {
  // Find all lines for this row value
  const linesForRow = lines.filter(l => l.bands?.y === rowValue);
  
  // Collect all mean values for this row
  const meanValues: number[] = [];
  
  for (const line of linesForRow) {
    const metadata = line.metadata;
    if (!metadata) continue;
    
    // Find matching summary data row
    const summaryRow = summaryTableData.find(row => {
      // Match based on row dimension
      if (rowDimension === Dimension.DISEASE) {
        // For disease rows, match disease and the within-band dimension (location or disease)
        const diseaseMatch = row[Dimension.DISEASE] === rowValue;
        const locationMatch = metadata.withinBand === 'global' 
          ? row[Dimension.LOCATION] === 'global'
          : row[Dimension.LOCATION] === metadata.withinBand || row.country === metadata.withinBand || row.subregion === metadata.withinBand;
        const activityMatch = !metadata.column || row[Dimension.ACTIVITY_TYPE] === metadata.column;
        return diseaseMatch && locationMatch && activityMatch;
      } else if (rowDimension === Dimension.LOCATION) {
        // For location rows, match location and within-band dimension (disease)
        const locationMatch = row[Dimension.LOCATION] === rowValue || row.country === rowValue || row.subregion === rowValue;
        const diseaseMatch = row[Dimension.DISEASE] === metadata.withinBand;
        const activityMatch = !metadata.column || row[Dimension.ACTIVITY_TYPE] === metadata.column;
        return locationMatch && diseaseMatch && activityMatch;
      } else if (rowDimension === Dimension.ACTIVITY_TYPE) {
        // For activity type rows, match activity type and within-band dimension (disease or location)
        const activityMatch = row[Dimension.ACTIVITY_TYPE] === rowValue;
        const diseaseMatch = row[Dimension.DISEASE] === metadata.withinBand;
        const locationMatch = !metadata.column || 
          metadata.column === 'global' 
          ? row[Dimension.LOCATION] === 'global'
          : row[Dimension.LOCATION] === metadata.column || row.country === metadata.column || row.subregion === metadata.column;
        return activityMatch && diseaseMatch && locationMatch;
      }
      return false;
    });
    
    if (!summaryRow) {
      throw new Error(
        `Missing summary table data for row category "${rowValue}" with metadata: ${JSON.stringify(metadata)}`
      );
    }
    
    meanValues.push(summaryRow[SummaryTableColumn.MEAN]);
  }
  
  if (meanValues.length === 0) {
    throw new Error(`No mean values found for row category "${rowValue}"`);
  }
  
  // Return the mean of means
  return meanValues.reduce((sum, val) => sum + val, 0) / meanValues.length;
};

const categoricalScales = (rowDimension: Dimension, lines: Lines<LineMetadata>): Partial<XY<string[]>> => {
  const dataStore = useDataStore();
  const summaryTableData = dataStore.summaryTableData;
  
  const xCategoricalScale = [...new Set(lines.map(l => l.bands?.x).filter(c => !!c))] as string[];
  const yCategoricalScaleUnsorted = [...new Set(lines.map(l => l.bands?.y).filter(c => !!c))] as string[];

  // Sort y categorical scale by mean of means (ascending order = descending on plot)
  const yCategoricalScale = yCategoricalScaleUnsorted.sort((a, b) => {
    const meanA = calculateMeanOfMeans(a, rowDimension, lines, summaryTableData);
    const meanB = calculateMeanOfMeans(b, rowDimension, lines, summaryTableData);
    
    // Sort ascending by mean (lowest at start, highest at end)
    // When equal, maintain stable alphabetical order
    if (meanA === meanB) {
      return a.localeCompare(b);
    }
    return meanA - meanB;
  });

  return {
    x: xCategoricalScale.length ? xCategoricalScale : undefined,
    y: yCategoricalScale.length ? yCategoricalScale : undefined,
  };
};

const locationSubstitutions = [
  [" and ", " & "],
  ["South-Eastern", "S.E."],
  ["South-Western", "S.W."],
  ["North-Eastern", "N.E."],
  ["North-Western", "N.W."],
  ["Eastern", "E."],
  ["Western", "W."],
  ["Southern", "S."],
  ["Northern", "N."],
  ["Central", "C."],
] as const;

const applySubstitutions = (str: string, substitutions: readonly (readonly [string, string])[]): string => {
  return substitutions.reduce(
    (acc, [original, replacement]) => acc.replaceAll(original, replacement),
    str
  );
};

// Returns a callback for formatting numerical tick labels for log scales, using LaTeX for MathJax.
const logScaleNumTickFormatter = () => (exponentForTen: number): string => {
  // NB the number passed in (derived from data files) is not the raw impact burden itself,
  // but the exponent for 10. For example, if the impact burden ratio is 1000 (10^3), the number passed
  // down to us is 3, i.e., log10 of 1000.

  return `$10^{${exponentForTen}}$`
};

// Returns a callback for formatting numerical tick labels for linear scales, using LaTeX for font consistency with log sacles.
const linearScaleNumTickFormatter = () => (num: number): string => `$${num}$`;

// Determine if y-axis need extra space (for long categorical axis labels).
const yAxisNeedsExtraSpace = (rowDimension: Dimension): boolean => rowDimension === Dimension.LOCATION;

// Returns a callback for formatting categorical tick labels for locations.
// Many locations have an unwieldy length.
// If the row dimension is 'Location', we apply substitutions and truncate labels that exceed the max length.
const locationTickFormatter = () =>
  (location: string): string => {
    const substitutionsApplied = applySubstitutions(location, locationSubstitutions);

    return substitutionsApplied.length > Y_TICK_LABEL_MAX_LENGTH
      ? substitutionsApplied.slice(0, Y_TICK_LABEL_MAX_LENGTH - ELLIPSIS.length) + ELLIPSIS
      : substitutionsApplied;
  }

const tickConfiguration = (logScaleEnabled: boolean, rowDimension: Dimension) => ({
  numerical: {
    x: {
      padding: 10,
      formatter: logScaleEnabled ? logScaleNumTickFormatter() : linearScaleNumTickFormatter(),
      enableMathJax: true,
    },
    y: { count: 0 },
  },
  categorical: {
    x: { padding: 40 },
    y: {
      padding: yAxisNeedsExtraSpace(rowDimension) ? 10 : 30,
      formatter: rowDimension === Dimension.LOCATION ? locationTickFormatter() : undefined,
    },
  },
});

type AxisConfig = [Partial<XY<string>>, Partial<XY<number | undefined>>];

const axisConfiguration = (
  rowDimension: Dimension,
): AxisConfig => [
    {
      x: "Impact ratio",
      y: sentenceCase(rowDimension),
    },
    {
      x: 0,
      y: 0 // Position y-axis label as far left as possible
    }
  ];

export const plotConfiguration = (
  rowDimension: Dimension,
  logScaleEnabled: boolean,
  lines: Lines<LineMetadata>,
): {
  constructorOptions: PartialChartOptions
  axisConfig: AxisConfig
  chartAppendConfig: [Partial<Scales>, Partial<Scales>, Partial<XY<string[]>>, Partial<Bounds["margin"]>]
} => {
  const numScales = numericalScales(logScaleEnabled, lines);
  const catScales = categoricalScales(rowDimension, lines);
  const margins = { left: yAxisNeedsExtraSpace(rowDimension) ? 170 : 110 };
  const tickConfig = tickConfiguration(logScaleEnabled, rowDimension);
  const constructorOptions = {
    tickConfig,
    categoricalScalePaddingInner: {
      x: catScales.x && catScales.x.length > 1 ? 0.02 : 0
    },
  };
  const axisConfig = axisConfiguration(rowDimension);

  return {
    constructorOptions,
    axisConfig,
    chartAppendConfig: [numScales, {}, catScales, margins],
  };
};

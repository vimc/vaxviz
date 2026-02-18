import { Dimension, type LineMetadata } from "@/types";
import { globalOption } from "./options";
import type { Lines, Scales } from "@reside-ic/skadi-chart";
// "Chart" and "types" are modules declared by @reside-ic/skadi-chart
import type { PartialChartOptions } from "Chart";
import type { Bounds, XY } from "types";
import sentenceCase from "./sentenceCase";

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

  let xStart = logScaleEnabled ? minX : Math.min(minX, 0);
  if (!logScaleEnabled && xStart < 0) {
    const padding = (maxX - minX) * 0.01;
    xStart = minX - padding;
  }

  // x values may be slightly negative for some cases eg Typhoid, JE
  return {
    x: { start: xStart, end: maxX },
    y: { start: 0, end: maxY },
  };
};

const categoricalScales = (lines: Lines<LineMetadata>): Partial<XY<string[]>> => {
  // Assume that the lines passed in have already been sorted for the y-axis.
  const xCategoricalScale = [...new Set(lines.map(l => l.bands?.x).filter(c => !!c))] as string[];
  const yCategoricalScale = [...new Set(lines.map(l => l.bands?.y).filter(c => !!c))] as string[];

  return {
    x: xCategoricalScale.length ? xCategoricalScale.sort() : undefined,
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
    const substitutionsApplied = locationSubstitutions.reduce(
      (acc, [original, replacement]) => acc.replaceAll(original, replacement),
      location
    );

    return substitutionsApplied.length > Y_TICK_LABEL_MAX_LENGTH
      ? substitutionsApplied.slice(0, Y_TICK_LABEL_MAX_LENGTH - ELLIPSIS.length) + ELLIPSIS
      : substitutionsApplied;
  }

const tickConfiguration = (logScaleEnabled: boolean, rowDimension: Dimension, numericalScales: Scales) => {
  const xRangeCrossesZero = numericalScales.x.start < 0 && numericalScales.x.end > 0;
  const numericalXTickCount = xRangeCrossesZero ? 3 : 5; // In d3, the count property approximately controls the number of ticks on each side of zero.

  return {
    numerical: {
      x: {
        padding: 10,
        formatter: logScaleEnabled ? logScaleNumTickFormatter() : linearScaleNumTickFormatter(),
        enableMathJax: true,
        count: numericalXTickCount,
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
  };
};

type AxisConfig = [Partial<XY<string>>, Partial<XY<number | undefined>>, Partial<XY<boolean>>];

const axisConfiguration = (
  rowDimension: Dimension,
  logScaleEnabled: boolean,
): AxisConfig => [
    {
      x: "Impact ratio (per thousand vaccinated)",
      y: sentenceCase(rowDimension),
    },
    {
      x: 0,
      y: 0 // Position y-axis label as far left as possible
    },
    {
      x: !logScaleEnabled,
      y: false,
    }
  ];

const margins = (rowDimension: Dimension) => ({ left: yAxisNeedsExtraSpace(rowDimension) ? 170 : 110 });

export const plotConfiguration = (
  rowDimension: Dimension,
  logScaleEnabled: boolean,
  lines: Lines<LineMetadata>,
): {
  constructorOptions: PartialChartOptions
  axisConfig: AxisConfig
  chartAppendConfig: [Partial<Scales>, Partial<Scales>, Partial<XY<string[]>>, Partial<Bounds["margin"]>]
  numericalScales: Scales
} => {
  const numScales = numericalScales(logScaleEnabled, lines);
  const catScales = categoricalScales(lines);
  const tickConfig = tickConfiguration(logScaleEnabled, rowDimension, numScales);
  const constructorOptions = {
    tickConfig,
    categoricalScalePaddingInner: {
      x: catScales.x && catScales.x.length > 1 ? 0.05 : 0
    },
  };
  const axisConfig = axisConfiguration(rowDimension, logScaleEnabled);

  return {
    constructorOptions,
    axisConfig,
    chartAppendConfig: [numScales, {}, catScales, margins(rowDimension)],
    numericalScales: numScales,
  };
};

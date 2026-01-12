import { Dimensions, type Metadata } from "@/types";
import { globalOption } from "./options";
// "Chart" and "types" are modules declared by @reside-ic/skadi-chart
import type { CategoricalScales, PartialChartOptions } from "Chart";
import type { Lines, Scales } from "@reside-ic/skadi-chart";
import type { Bounds, XY } from "types";
import sentenceCase from "./sentenceCase";

const ELLIPSIS = "...";
const Y_TICK_LABEL_MAX_LENGTH = globalOption.label.length;

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

// Since the tick labels are rendered as part of a SVG, we can't use the HTML <sup> tag,
// so we use Unicode superscript characters instead.
const superscripts = [
  ['0', '⁰'],
  ['1', '¹'],
  ['2', '²'],
  ['3', '³'],
  ['4', '⁴'],
  ['5', '⁵'],
  ['6', '⁶'],
  ['7', '⁷'],
  ['8', '⁸'],
  ['9', '⁹'],
  ['-', '⁻'],
  ['+', '⁺']
] as const;

const applySubstitutions = (str: string, substitutions: readonly (readonly [string, string])[]): string => {
  return substitutions.reduce(
    (acc, [original, replacement]) => acc.replaceAll(original, replacement),
    str
  );
};

// Determine which axes need extra space (e.g., for log scale labels or categorical axis labels).
const xAxisNeedsExtraSpace = (logScaleEnabled: boolean): boolean => logScaleEnabled;
const yAxisNeedsExtraSpace = (rowDimension: Dimensions): boolean => rowDimension === Dimensions.LOCATION;

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

// Returns a callback for formatting numerical tick labels for log scales.
// Returns scientific notation, e.g. "1.2×10^-2" instead of "0.012".
const logScaleNumTickFormatter = () => (num: number): string => {
  const [mantissa, exponent] = num.toExponential().split("e");
  const exponentMaybeWithNegativeSign = exponent?.replace("+", "");
  const superscriptExponent = exponentMaybeWithNegativeSign
    ?.split("")
    .map(char => applySubstitutions(char, superscripts))
    .join("");
  return `${mantissa === "1" ? `` : `${mantissa}×`}10${superscriptExponent}` +
    (num === 0 ? " (0)" : "");
};

const tickConfiguration = (
  logScaleEnabled: boolean,
  rowDimension: Dimensions,
) => {
  const xNumTickFormatter = logScaleEnabled ? logScaleNumTickFormatter() : undefined;
  const yCategoricalTickFormatter = rowDimension === Dimensions.LOCATION
    ? locationTickFormatter()
    : undefined;
  const xAxisNeedsSpace = xAxisNeedsExtraSpace(logScaleEnabled);
  const yAxisNeedsSpace = yAxisNeedsExtraSpace(rowDimension);

  return {
    numerical: {
      x: {
        padding: xAxisNeedsSpace ? 30 : 10,
        rotate: xAxisNeedsSpace ? -45 : 0,
        formatter: xNumTickFormatter,
        count: 5, // This prop only guarantees the number of ticks is 'approximately' count.
      },
    },
    categorical: {
      x: {
        padding: xAxisNeedsSpace ? 65 : 30,
      },
      y: {
        padding: yAxisNeedsSpace ? 10 : 30,
        formatter: yCategoricalTickFormatter,
      },
    },
  };
}

const numericalScales = (logScaleEnabled: boolean, lines: Lines<Metadata>): Scales => {
  const maxX = Math.max(...lines.flatMap(l => {
    const lastPoint = l.points[l.points.length - 1]!;
    return lastPoint.x;
  }));
  const maxY = Math.max(...lines.flatMap(l => Math.max(...l.points.map(p => p.y))));
  const minX = Math.min(...lines.flatMap(l => {
    const firstPoint = l.points[0]!;
    return firstPoint.x;
  }));

  return {
    x: { start: logScaleEnabled ? minX : 0, end: maxX },
    y: { start: 0, end: maxY },
  };
};

const categoricalScales = (lines: Lines<Metadata>): CategoricalScales => {
  const xCategoricalScale = [...new Set(lines.map(l => l.bands?.x).filter(c => !!c))] as string[];
  const yCategoricalScale = [...new Set(lines.map(l => l.bands?.y).filter(c => !!c))] as string[];

  return {
    x: xCategoricalScale,
    y: yCategoricalScale,
  };
};

type AxisConfig = [Partial<XY<string>>, Partial<XY<number | undefined>>];

const axisConfiguration = (
  logScaleEnabled: boolean,
  rowDimension: Dimensions,
): AxisConfig => [
    {
      x: "Impact ratio",
      y: sentenceCase(rowDimension),
    },
    {
      x: xAxisNeedsExtraSpace(logScaleEnabled) ? 0 : undefined,
      y: 0 // Position y-axis label as far left as possible
    }
  ];

export const plotConfiguration = (
  rowDimension: Dimensions,
  logScaleEnabled: boolean,
  lines: Lines<Metadata>,
): {
  tickConfig: PartialChartOptions["tickConfig"]
  axisConfig: AxisConfig
  chartAppendConfig: [Partial<Scales>, Partial<Scales>, Partial<CategoricalScales>, Partial<Bounds["margin"]>]
} => {
  const numScales = numericalScales(logScaleEnabled, lines);
  const catScales = categoricalScales(lines);
  const margins = { left: yAxisNeedsExtraSpace(rowDimension) ? 170 : 100 }; // Leave space for long y-axis labels.
  const tickConfig = tickConfiguration(logScaleEnabled, rowDimension);
  const axisConfig = axisConfiguration(logScaleEnabled, rowDimension);

  return {
    tickConfig,
    axisConfig,
    chartAppendConfig: [numScales, {}, catScales, margins],
  };
}

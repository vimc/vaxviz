import { Dimensions, type LineMetadata } from "@/types";
import { globalOption } from "./options";
import type { Lines, Scales } from "@reside-ic/skadi-chart";
// "Chart" and "types" are modules declared by @reside-ic/skadi-chart
import type { PartialChartOptions } from "Chart";
import type { Bounds, XY } from "types";
import sentenceCase from "./sentenceCase";

const ELLIPSIS = "...";
const Y_TICK_LABEL_MAX_LENGTH = globalOption.label.length;
export const TOOLTIP_RADIUS_PX = 100; // Maximum distance in px from point for triggering tooltips to be displayed

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
] as const;

const applySubstitutions = (str: string, substitutions: readonly (readonly [string, string])[]): string => {
  return substitutions.reduce(
    (acc, [original, replacement]) => acc.replaceAll(original, replacement),
    str
  );
};

// Returns a callback for formatting numerical tick labels for log scales.
const logScaleNumTickFormatter = () => (exponentForTen: number): string => {
  // NB the number passed in (derived from data files) is not the raw impact burden itself,
  // but the exponent for 10. For example, if the impact burden ratio is 1000 (10^3), the number passed
  // down to us is 3, i.e., log10 of 1000.
  if (!Number.isInteger(exponentForTen)) {
    // Reject tick labels that would contain decimal points in the exponent
    // since the decimal point is very tricky to render nicely using unicode superscript.
    // In the future, we'll specify the exact tick values we want, so that we don't get unused gridlines;
    // that depends on:
    // TODO: vimc-9194: expose d3-axis tickValues function via skadi-chart.
    return "";
  }
  const superscriptExponent = exponentForTen
    ?.toString()
    .split("")
    .map(char => applySubstitutions(char, superscripts))
    .join("");
  return `10${superscriptExponent}`;
};

// Determine if y-axis need extra space (for long categorical axis labels).
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

const tickConfiguration = (logScaleEnabled: boolean, rowDimension: Dimensions) => ({
  numerical: {
    x: {
      padding: 10,
      formatter: logScaleEnabled ? logScaleNumTickFormatter() : undefined,
    },
    y: { count: 0 },
  },
  categorical: {
    x: { padding: 30 },
    y: {
      padding: yAxisNeedsExtraSpace(rowDimension) ? 10 : 30,
      formatter: rowDimension === Dimensions.LOCATION ? locationTickFormatter() : undefined,
    },
  },
});

const numericalScales = (logScaleEnabled: boolean, lines: Lines<LineMetadata>): Scales => {
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

const categoricalScales = (lines: Lines<LineMetadata>): XY<string[]> => {
  const xCategoricalScale = [...new Set(lines.map(l => l.bands?.x).filter(c => !!c))] as string[];
  const yCategoricalScale = [...new Set(lines.map(l => l.bands?.y).filter(c => !!c))] as string[];

  return {
    x: xCategoricalScale,
    y: yCategoricalScale,
  };
};

type AxisConfig = [Partial<XY<string>>, Partial<XY<number | undefined>>];

const axisConfiguration = (
  rowDimension: Dimensions,
): AxisConfig => [
    {
      x: "Impact ratio",
      y: sentenceCase(rowDimension),
    },
    {
      y: 0 // Position y-axis label as far left as possible
    }
  ];

export const plotConfiguration = (
  rowDimension: Dimensions,
  logScaleEnabled: boolean,
  lines: Lines<LineMetadata>,
): {
  tickConfig: PartialChartOptions["tickConfig"]
  axisConfig: AxisConfig
  chartAppendConfig: [Partial<Scales>, Partial<Scales>, Partial<XY<string[]>>, Partial<Bounds["margin"]>]
} => {
  const numScales = numericalScales(logScaleEnabled, lines);
  const catScales = categoricalScales(lines);
  const margins = { left: yAxisNeedsExtraSpace(rowDimension) ? 170 : 100 };
  const tickConfig = tickConfiguration(logScaleEnabled, rowDimension);
  const axisConfig = axisConfiguration(rowDimension);

  return {
    tickConfig,
    axisConfig,
    chartAppendConfig: [numScales, {}, catScales, margins],
  };
}

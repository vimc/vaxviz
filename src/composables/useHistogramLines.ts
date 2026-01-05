import { Axes, Dimensions, HistCols, type Coords, type HistDataRow, type LineMetadata } from '@/types';
import type { LineConfig, Lines } from 'types';
import { computed, toValue } from 'vue';

// Construct histogram/ridge-shaped lines by building area lines whose points trace the
// outline of the histogram.  
export default (
  data: () => HistDataRow[],
  axisDimensions: () => {
    [Axes.COLUMN]: Dimensions | null;
    [Axes.ROW]: Dimensions;
    [Axes.WITHIN_BAND]: Dimensions;
  },
  getCategory: (dim: Dimensions | null, dataRow: HistDataRow) => string,
  getLabel: (dim: Dimensions | null, value: string) => string | undefined,
) => {
  const dimensions = computed(() => toValue(axisDimensions));

  // Return corner coordinates of the histogram bar representing a row from a data file.
  const createBarCoords = (dataRow: HistDataRow): Coords[] => {
    const topLeftPoint = { x: dataRow[HistCols.LOWER_BOUND], y: dataRow[HistCols.COUNTS] };
    const topRightPoint = { x: dataRow[HistCols.UPPER_BOUND], y: dataRow[HistCols.COUNTS] };
    // closingOffPoint is a point at y=0 to close off the histogram bar, which will be needed if either:
    // 1) this ends up being the last bar in the line, or
    // 2) there is a data gap until the next bar in this line.
    // Since we don't know if (1) or (2) hold at this point (we haven't processed the next bar yet),
    // we always add the closingOffPoint, and remove it later if unneeded.
    const closingOffPoint = { x: dataRow[HistCols.UPPER_BOUND], y: 0 };
    return [topLeftPoint, topRightPoint, closingOffPoint];
  }

  // Initialize a skadi-chart LineConfig object to be used to draw a 'ridgeline' (the outline of a histogram).
  const initializeLine = (
    barCoords: Coords[],
    categoryValues: LineMetadata,
  ): Lines<LineMetadata>[0] => {
    return {
      points: barCoords,
      bands: {
        x: getLabel(dimensions.value[Axes.COLUMN], categoryValues[Axes.COLUMN]),
        y: getLabel(dimensions.value[Axes.ROW], categoryValues[Axes.ROW]),
      },
      style: {},
      metadata: categoryValues,
      fill: true,
    };
  };

  // Construct histogram/ridge-shaped lines by building area lines whose points trace the
  // outline of the histogram bars (including the spaces in between them).
  const ridgeLines = computed((): Lines<LineMetadata> => {
    // A 3-dimensional dictionary of lines.
    // We use x-value as the key at the first level, then y-value on the second, then withinBandValue.
    // If the x-value (or anything else) is undefined, then the key should be an empty string.
    const lines: Record<string, Record<string, Record<string, LineConfig<LineMetadata>>>> = {};

    toValue(data).forEach(dataRow => {
      // Each line needs to know its category for each categorical axis in use.
      const columnCat = getCategory(dimensions.value[Axes.COLUMN], dataRow);
      const rowCat = getCategory(dimensions.value[Axes.ROW], dataRow);
      const withinBandCat = getCategory(dimensions.value[Axes.WITHIN_BAND], dataRow);
      const categoryValues = { [Axes.COLUMN]: columnCat, [Axes.ROW]: rowCat, [Axes.WITHIN_BAND]: withinBandCat };

      const lowerBound = dataRow[HistCols.LOWER_BOUND];
      const barCoords = createBarCoords(dataRow);

      // We need to plot at most one line for each of the combinations of dimensions in use.
      const line = lines[columnCat]?.[rowCat]?.[withinBandCat];

      if (!line) {
        // No line exists yet for this combination of categorical axis values, so we need to create it.
        barCoords.unshift({ x: lowerBound, y: 0 }); // Start the first bar at y=0.
        const newLine = initializeLine(barCoords, categoryValues);
        lines[columnCat] ??= {};
        lines[columnCat]![rowCat] ??= {};
        lines[columnCat]![rowCat]![withinBandCat] = newLine;
      } else {
        // A line already exists for this combination of categorical axis values, so we can append some points to it.
        const previousPoint = line.points[line.points.length - 1];
        // If you encounter overlapping histogram bars, you can use >= instead of === in the below condition,
        // though this is not expected.
        if (previousPoint && previousPoint.x === lowerBound && previousPoint.y === 0) {
          // If the previous bar's upper bound is the same as this bar's lower bound,
          // we should remove the previous close-off point, as we are continuing the line directly from the previous bar to this bar.
          line.points.pop();
        } else if (previousPoint) {
          // There is a previous section, complete with close-off point, but this bar is disconnected from it.
          // Leave the previous close-off point and make a new starting point at y=0.
          line.points.push({ x: lowerBound, y: 0 });
        }
        line.points.push(...barCoords);
      }
    });

    // Unpack the lines dictionary into a flat array.
    return Object.values(lines).flatMap(y => Object.values(y)).flatMap(z => Object.values(z));
  });

  return { ridgeLines }
}

import { useAppStore } from '@/stores/appStore';
import { Axis, Dimension, SummaryTableColumn, type Coords, type LineMetadata, type SummaryTableDataRow } from '@/types';
import { numericalScales } from '@/utils/plotConfiguration';
import type { Lines } from 'types';
import { computed, toValue, type MaybeRefOrGetter } from 'vue';

// Construct shaded confidence intervals by building area lines
export default (
  summaryTableData: MaybeRefOrGetter<SummaryTableDataRow[]>,
  displayedRidgeLines: MaybeRefOrGetter<Lines<LineMetadata>>,
  getCategory: (dim: Dimension | null, dataRow: SummaryTableDataRow) => string,
  getLabel: (dim: Dimension | null, value: string) => string | undefined,
) => {
  const appStore = useAppStore();

  const numericalScaleY = computed(() => {
    return numericalScales(appStore.logScaleEnabled, toValue(displayedRidgeLines)).y;
  });

  // Return corner coordinates of the rectangle representing the confidence interval.
  const ciPointCoords = (dataRow: SummaryTableDataRow): Coords[] => {
    const ciLower = dataRow[SummaryTableColumn.CI_LOWER];
    const ciUpper = dataRow[SummaryTableColumn.CI_UPPER];
    const maxY = toValue(numericalScaleY).end;

    const bottomLeftPoint = { x: ciLower, y: 0 }
    const topLeftPoint = { x: ciLower, y: maxY };
    const topRightPoint = { x: ciUpper, y: maxY };
    const bottomRightPoint = { x: ciUpper, y: 0 };
    return [bottomLeftPoint, topLeftPoint, topRightPoint, bottomRightPoint];
  }

  // Initialize a skadi-chart LineConfig object to be used to draw the confidence interval area.
  const initializeCILine = (
    points: Coords[],
    categoryValues: LineMetadata,
  ): Lines<LineMetadata>[0] => {
    return {
      points,
      bands: {
        x: getLabel(appStore.dimensions[Axis.COLUMN], categoryValues[Axis.COLUMN]),
        y: getLabel(appStore.dimensions[Axis.ROW], categoryValues[Axis.ROW]),
      },
      style: {},
      metadata: categoryValues,
      fill: true,
    };
  };

  const confidenceIntervalLines = computed((): Lines<LineMetadata> => {
    // A 3-dimensional dictionary of lines.
    // We use x-value as the key at the first level, then y-value on the second, then withinBandValue.
    // If the x-value (or anything else) is undefined, then the key should be an empty string.
    return toValue(summaryTableData).map(dataRow => {
      // Each line needs to know its category for each categorical axis in use.
      const columnCat = getCategory(appStore.dimensions[Axis.COLUMN], dataRow);
      const rowCat = getCategory(appStore.dimensions[Axis.ROW], dataRow);
      const withinBandCat = getCategory(appStore.dimensions[Axis.WITHIN_BAND], dataRow);
      const categoryValues = { [Axis.COLUMN]: columnCat, [Axis.ROW]: rowCat, [Axis.WITHIN_BAND]: withinBandCat };

      const points = ciPointCoords(dataRow);

      return initializeCILine(points, categoryValues);
    });
  });

  return { confidenceIntervalLines }
}

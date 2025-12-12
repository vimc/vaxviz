<template>
  <div class="chart-container">
    <div
      ref="chartWrapper"
      id="chartWrapper"
      :data-test="JSON.stringify({
        histogramDataRowCount: dataStore.histogramData.length,
        lineCount: ridgeLines.length,
        x: appStore.dimensions.x,
        y: appStore.dimensions.y,
        withinBand: appStore.dimensions.withinBand,
      })"
    />
    <p v-if="dataStore.fetchErrors.length" class="mt-5">Errors: {{ dataStore.fetchErrors }}</p>
</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { debounce } from 'perfect-debounce';
import { Chart, type Lines } from '@reside-ic/skadi-chart';
import { getDimensionCategory } from '@/utils/fileParse';
import titleCase from '@/utils/titleCase';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import { type Coords, Dimensions, HistCols, type HistDataRow } from '@/types';
import { type Coords, Dimensions, HistCols, type HistDataRow } from '@/types';
import colors from '@/utils/colors';

const appStore = useAppStore();
const dataStore = useDataStore();

const chartWrapper = ref<HTMLDivElement | null>(null);

type LineMetadata = {
  withinBandVal?: string;
  xVal?: string;
  yVal?: string
};

// Return corner coordinates of the histogram bar representing a row from a data file.
const createBarCoords = (dataRow: HistDataRow): Coords[] => {
  const topLeftPoint = { x: dataRow[HistCols.LOWER_BOUND], y: dataRow[HistCols.COUNTS] };
  const topRightPoint = { x: dataRow[HistCols.UPPER_BOUND], y: dataRow[HistCols.COUNTS] };
  // closingOffPoint is a point at y=0 to close off the histogram bar, which will be needed if either:
  // 1) this ends up being the last bar in the line, or
  // 2) there is a data gap until the next bar in this line.
  const closingOffPoint = { x: dataRow[HistCols.UPPER_BOUND], y: 0 };
  return [topLeftPoint, topRightPoint, closingOffPoint];
}

const initializeLine = (
  lowerBound: number,
  barCoords: Coords[],
  categories: LineMetadata,
  color: string,
): Lines<LineMetadata>[0] => {
  const { xVal, yVal } = categories;

  return {
    points: [
      { x: lowerBound, y: 0 },
      ...barCoords,
    ],
    bands: {
      ...(xVal ? { x: xVal } : {}),
      ...(yVal ? { y: yVal } : {}),
    },
    style: {
      strokeColor: color,
      strokeWidth: 1,
      opacity: 1,
      fillColor: color,
      fillOpacity: 0.2, // Keep this value low since mixing translucent colours creates the illusion of an extra ridgeline.
    },
    metadata: categories,
    fill: true,
  };
}

// Construct histogram/ridge-shaped lines by building area lines whose points trace the
// outline of the histogram bars (including the spaces in between them).
const ridgeLines = computed(() => {
  // A 3-dimensional dictionary of lines.
  // We use x-value as the key at the first level, then y-value on the second, then withinBandValue.
  // If the x-value (or anything else) is undefined, then the key should be an empty string.
  const lines: Record<string, Record<string, Record<string, Lines<LineMetadata>[0]>>> = {};

  dataStore.histogramData.filter(dataRow =>
    [Dimensions.LOCATION, Dimensions.DISEASE].every(dim => {
      const dimensionCat = getDimensionCategory(dim, dataRow);
      const filterValues = appStore.filters[dim]?.map(v => v.toLowerCase());
      return filterValues?.includes(dimensionCat.toLowerCase());
    })
  ).forEach(dataRow => {
    // Each line needs to know its category for each categorical axis in use.
    const xVal = getDimensionCategory(appStore.dimensions.x, dataRow);
    const yVal = getDimensionCategory(appStore.dimensions.y, dataRow);
    const withinBandVal = getDimensionCategory(appStore.dimensions.withinBand, dataRow);

    const lowerBound = dataRow[HistCols.LOWER_BOUND];
    const barCoords = createBarCoords(dataRow);

    // We need to plot at most one line for each of the combinations of dimensions in use.
    const line = lines[xVal]?.[yVal]?.[withinBandVal];

    if (!line) {
      lines[xVal] ??= {};
      lines[xVal]![yVal] ??= {};

      // TODO: assign colors in a smart way based on which dimensions are in use and have multiple values.
      // TODO: persist color on changing the axes etc, where applicable.
      const color = colors[Math.floor(Object.values(lines[xVal] ?? {}).length % colors.length)]!;

      lines[xVal]![yVal]![withinBandVal] = initializeLine(lowerBound, barCoords, { xVal, yVal, withinBandVal }, color);
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
        // todo: check if we can survive without math max (Was this to handle overlapping histogram bars?)
        line.points.push({ x: Math.max(lowerBound, previousPoint.x), y: 0 });
      }
      line.points.push(...barCoords);
    }
  });

  // Unpack the lines dictionary into an array.
  return Object.values(lines)
    .flatMap(y => Object.values(y)
    .filter(z => {
      if (appStore.dimensions.y === Dimensions.DISEASE && appStore.dimensions.withinBand === Dimensions.LOCATION) {
        // If data for a disease is not present at the same geographical resolution as the focus, we should exclude the disease from the plot.
        const locations = Object.keys(z).map(k => k.toLowerCase());
        return locations.includes(appStore.focus.toLowerCase());
      } else {
        return true;
      };
    })
    .flatMap(z => Object.values(z)));
});

// Debounce chart updates so that there is no flickering as filters change at a different moment from focus/dimensions.
const updateChart = debounce(() => {
  if (!chartWrapper.value || ridgeLines.value.length === 0) {
    return;
  }
  const minX = Math.min(...ridgeLines.value.flatMap(l => l.points![0]?.x ?? 0));
  const maxX = Math.max(...ridgeLines.value.flatMap(l => l.points[l.points.length - 1]!.x));
  const maxY = Math.max(...ridgeLines.value.flatMap(l => Math.max(...l.points.map(p => p.y))));

  const numericalScales = {
    x: { start: appStore.logScaleEnabled ? minX : 0, end: maxX },
    y: { start: 0, end: maxY },
  };

  const xCategoricalScale = ridgeLines.value.map(l => l.bands?.x).filter(c => !!c) as string[];
  const yCategoricalScale = ridgeLines.value.map(l => l.bands?.y).filter(c => !!c) as string[];
  const categoricalScales = {
    ...(xCategoricalScale.length ? { x: xCategoricalScale } : {}),
    ...(yCategoricalScale.length ? { y: yCategoricalScale } : {}),
  };

  const chart = new Chart()
    .addAxes({
      // TODO: Put the 10^n into the tick labels, pending release of https://github.com/mrc-ide/skadi-chart/pull/58
      x: appStore.logScaleEnabled ? "Impact ratio (10^n)" : "Impact ratio",
      y: titleCase(appStore.dimensions.y),
    })
    .addTraces(ridgeLines.value)
    .addArea()
    // .addGridLines() // TODO: Enable gridlines only in x axis, pending release of https://github.com/mrc-ide/skadi-chart/pull/57
    // .addTooltips() // TODO: Enable tooltips once behaviour is satisfactory for area charts (vimc-8117)
    .makeResponsive()

  if (Object.values(categoricalScales).length !== 2) {
    chart.addZoom();
  }

  chart.appendTo(chartWrapper.value, numericalScales, {}, categoricalScales);
}, 100);

watch([ridgeLines, chartWrapper], updateChart);
</script>

<style lang="scss" scoped>
.chart-container {
  --chart-margin: 80px;
  width: 100%;
  height: calc(100dvh - 2 * var(--chart-margin));
  display: flex;
}

#chartWrapper {
  width: 100%;
  height: 100%;
  flex: 5;
  margin: var(--chart-margin);
}
</style>

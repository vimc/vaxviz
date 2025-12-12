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
    <ul>
      <li v-for="(line, index) in ridgeLines" :key="index">
        Line {{ index + 1 }} - Bands: {{ line.bands }}, within band: {{ line.metadata?.withinBandVal }}
      </li>
    </ul>
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

const appStore = useAppStore();
const dataStore = useDataStore();

const chartWrapper = ref<HTMLDivElement | null>(null);

type LineMetadata = {
  withinBandVal?: string;
  xVal?: string;
  yVal?: string
};

// Return corner coordinates of the histogram bar representing the current row.
const createBarCoords = (dataRow: HistDataRow): Coords[] => {
  const topLeftPoint = { x: dataRow[HistCols.LOWER_BOUND], y: dataRow[HistCols.COUNTS] };
  const topRightPoint = { x: dataRow[HistCols.UPPER_BOUND], y: dataRow[HistCols.COUNTS] };
  // closingOffPoint is a point at y=0 to close off the histogram bar, which will be needed if either:
  // 1) this ends up being the last bar in the line, or
  // 2) there is a data gap until the next bar in this line.
  const closingOffPoint = { x: dataRow[HistCols.UPPER_BOUND], y: 0 };
  return [topLeftPoint, topRightPoint, closingOffPoint];
}

const initializeLine = (lowerBound: number, barCoords: Coords[], categories: LineMetadata): Lines<LineMetadata>[0] => {
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
      strokeWidth: 0.5,
      opacity: 1,
      fillOpacity: 0.3,
    },
    metadata: categories,
    fill: true,
  };
}

// Construct histogram/ridge-shaped lines by building area lines whose points trace the
// outline of the histogram bars (including the spaces in between them).
const ridgeLines = computed(() => {
  const lines: Lines<LineMetadata> = [];
  dataStore.histogramData.filter(dataRow =>
    [Dimensions.LOCATION, Dimensions.DISEASE].every(dim => {
      const dimensionCat = getDimensionCategory(dim, dataRow) ?? "";
      const filterValues = appStore.filters[dim]?.map(v => v.toLowerCase());
      return filterValues?.includes(dimensionCat.toLowerCase());
    })
  ).forEach(dataRow => {
    // Each line needs to know its category for each categorical axis in use.
    const categories: LineMetadata = {
      xVal: getDimensionCategory(appStore.dimensions.x, dataRow),
      yVal: getDimensionCategory(appStore.dimensions.y, dataRow),
      withinBandVal: getDimensionCategory(appStore.dimensions.withinBand, dataRow),
    };

    const lowerBound = dataRow[HistCols.LOWER_BOUND];
    const barCoords = createBarCoords(dataRow);

    // TODO: Store lines in a nested dict/map? That would save manually storing a set of xCategories/yCategories.
    // We need to plot at most one line for each of the combinations of dimensions in use.
    const line = lines.find(({ metadata }) => {
      return metadata?.xVal === categories.xVal &&
             metadata?.yVal === categories.yVal &&
             metadata?.withinBandVal === categories.withinBandVal;
    });

    if (!line) {
      // The line does not already exist, so create it.

      // TODO: persist color on changing the axes etc, where applicable.
      lines.push(initializeLine(lowerBound, barCoords, categories));
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

  return lines;
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
    .addAxes({ x: "Impact ratio", y: titleCase(appStore.dimensions.y) })
    .addTraces(ridgeLines.value)
    .addArea()
    // .addGridLines() // TODO: Enable gridlines only in x axis, pending release of https://github.com/mrc-ide/skadi-chart/pull/57
    // .addTooltips() // TODO: Enable tooltips once behaviour is satisfactory for area charts (vimc-8117)
    .makeResponsive()

  if (Object.values(categoricalScales).length !== 2) {
    chart.addZoom();
  }

  chart.appendTo(chartWrapper.value, numericalScales, {}, categoricalScales);
}, 50);

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

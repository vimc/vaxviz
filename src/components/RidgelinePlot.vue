<template>
  <div class="chart-container">
    <p v-if="ridgeLines.length === 0" class="m-auto">
      <!-- E.g. Focus disease MenA, without splitting by activity type. -->
      No data available for the selected options.
    </p>
    <div
      ref="chartWrapper"
      id="chartWrapper"
      v-if="ridgeLines.length"
      :data-test="JSON.stringify({
        histogramDataRowCount: dataStore.histogramData.length,
        lineCount: ridgeLines.length,
        ...appStore.dimensions,
      })"
    />
    <p v-if="dataStore.fetchErrors.length" class="mt-5">Errors: {{ dataStore.fetchErrors }}</p>
    <!-- Legend for manual testing only -->
    <div v-if="colorStore.colorMap && colorStore.colorMap.size >= 2">
      <h3>Legend, for manual testing only</h3>
      <ul>
        <li
          v-for="([value, color]) in colorStore.colorMap"
          :key="value"
        >
          <span
            class="legend-color-box"
            :style="{
              backgroundColor: color,
              width: '1em',
              height: '1em',
              display: 'inline-block',
            }"
          ></span>
          <span>
            {{ dimensionOptionLabel(colorStore.colorDimension, value) }}
          </span>
        </li>
      </ul>
    </div>
</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { debounce } from 'perfect-debounce';
import { Chart, type Lines } from '@reside-ic/skadi-chart';
import { getDimensionCategoryValue } from '@/utils/fileParse';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import { useColorStore } from '@/stores/colorStore';
import { Axes, type Coords, Dimensions, HistCols, type HistDataRow, type LineMetadata } from '@/types';
import titleCase from '@/utils/titleCase';
import { dimensionOptionLabel } from '@/utils/options';
import type { LineConfig } from 'types';

const appStore = useAppStore();
const dataStore = useDataStore();
const colorStore = useColorStore();

const chartWrapper = ref<HTMLDivElement | null>(null);
const ridgeLines = ref<Lines<LineMetadata>>([]);

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
  categoryValues: LineMetadata,
): Lines<LineMetadata>[0] => {
  const color = colorStore.getColorForLine(categoryValues);
  const { x: xCat, y: yCat } = categoryValues;
  const { x: xDim, y: yDim } = appStore.dimensions;

  const xLabel = xCat && xDim ? dimensionOptionLabel(xDim, xCat) : undefined;
  const yLabel = yCat && yDim ? dimensionOptionLabel(yDim, yCat) : undefined;
  return {
    points: [
      { x: lowerBound, y: 0 },
      ...barCoords,
    ],
    bands: {
      ...(xLabel ? { x: xLabel } : {}),
      ...(yLabel ? { y: yLabel } : {}),
    },
    style: {
      strokeColor: color,
      strokeWidth: 1,
      opacity: 1,
      fillColor: color,
      fillOpacity: 0.2, // Keep this value low since mixing translucent colours creates the illusion of an extra ridgeline.
    },
    metadata: categoryValues,
    fill: true,
  };
};

const displayPlotRow = (lines: Record<string, LineConfig<LineMetadata>>) => {
  if (appStore.dimensions[Axes.Y] !== Dimensions.DISEASE || appStore.dimensions[Axes.WITHIN_BAND] !== Dimensions.LOCATION) {
    return true;
  }

  // If data for a disease is not present at the same geographical resolution as the focus, we should exclude the disease from the plot.
  // E.g. Say the focus value is 'Djibouti', a location. If for some row of ridgelines - i.e. some y-value, such as Malaria -
  // there is no line for Djibouti, we should exclude the Malaria row entirely so that we only display rows that are relevant for Djibouti.
  const locations = Object.keys(lines);
  return locations.includes(appStore.focus);
}

// Construct histogram/ridge-shaped lines by building area lines whose points trace the
// outline of the histogram bars (including the spaces in between them).
const constructLines = () => {
  // A 3-dimensional dictionary of lines.
  // We use x-value as the key at the first level, then y-value on the second, then withinBandValue.
  // If the x-value (or anything else) is undefined, then the key should be an empty string.
  const lines: Record<string, Record<string, Record<string, LineConfig<LineMetadata>>>> = {};

  dataStore.histogramData.filter(dataRow =>
    [Dimensions.LOCATION, Dimensions.DISEASE].every(dim => {
      const dimensionVal = getDimensionCategoryValue(dim, dataRow);
      return appStore.filters[dim]?.includes(dimensionVal);
    })
  ).forEach(dataRow => {
    // Each line needs to know its category for each categorical axis in use.
    const xCat = getDimensionCategoryValue(appStore.dimensions[Axes.X], dataRow);
    const yCat = getDimensionCategoryValue(appStore.dimensions[Axes.Y], dataRow);
    const withinBandCat = getDimensionCategoryValue(appStore.dimensions[Axes.WITHIN_BAND], dataRow);

    const lowerBound = dataRow[HistCols.LOWER_BOUND];
    const barCoords = createBarCoords(dataRow);

    // We need to plot at most one line for each of the combinations of dimensions in use.
    const line = lines[xCat]?.[yCat]?.[withinBandCat];

    if (!line) {
      // No line exists yet for this combination of categorical axis values, so we need to create it.
      const newLine = initializeLine(lowerBound, barCoords, { x: xCat, y: yCat, withinBand: withinBandCat });
      lines[xCat] ??= {};
      lines[xCat]![yCat] ??= {};
      lines[xCat]![yCat]![withinBandCat] = newLine;
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
  ridgeLines.value = Object.values(lines)
    .flatMap(y => Object.values(y)
    .filter(displayPlotRow)
    .flatMap(z => Object.values(z)));
};

// Debounce chart updates so that there is no flickering as filters change at a different moment from focus/dimensions.
const updateChart = debounce(() => {
  // `dataStore.histogramData` has changed, so we reset the color mapping so that we always use the earliest
  // colors in the list.
  colorStore.resetColorMapping();
  constructLines();
  if (ridgeLines.value.length === 0 || !chartWrapper.value) {
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
    .addGridLines({ x: true })
    // .addTooltips() // TODO: Enable tooltips once behaviour is satisfactory for area charts (vimc-8117)
    .makeResponsive()

  if (Object.values(categoricalScales).length !== 2) {
    chart.addZoom();
  }

  chart.appendTo(chartWrapper.value, numericalScales, {}, categoricalScales);
}, 100);

watch([() => dataStore.histogramData, () => appStore.focus, chartWrapper],
  updateChart,
{ immediate: true });
</script>

<style lang="scss" scoped>
.chart-container {
  --chart-margin: 80px;
  width: 100%;
  height: calc(100dvh - 2 * var(--chart-margin));
  display: flex;
  flex-wrap: wrap;
}

#chartWrapper {
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
  margin: var(--chart-margin);
}
</style>

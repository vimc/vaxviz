<template>
  <div class="chart-container">
    <div
      ref="chartWrapper"
      id="chartWrapper"
      :data-test="JSON.stringify({
        histogramDataRowCount: dataStore.histogramData.length,
        lineCount: filteredLines.length,
        x: appStore.dimensions.x,
        y: appStore.dimensions.y,
        withinBand: appStore.dimensions.withinBand,
      })"
    />
    <p v-if="dataStore.fetchErrors.length" class="mt-5">Errors: {{ dataStore.fetchErrors }}</p>
    <ul>
      <li v-for="(line, index) in filteredLines" :key="index">
        Line {{ index + 1 }} - Bands: {{ line.bands }}, within band: {{ line.metadata?.withinBandAxisValue }}
      </li>
    </ul>
</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getDimensionCategory } from '@/utils/fileParse';
import titleCase from '@/utils/titleCase';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import { Dimensions, HistCols } from '@/types';
import { Chart, type Lines } from '@reside-ic/skadi-chart';

const appStore = useAppStore();
const dataStore = useDataStore();

const chartWrapper = ref<HTMLDivElement | null>(null);

type LineMetadata = {
  withinBandAxisValue: string;
};

// TODO: Avoid wasteful calculation of points for lines that will not be rendered?

// Construct histogram/ridge-shaped lines by building area lines whose points trace the
// outline of the histogram bars (including the spaces in between them).
const ridgeLines = computed(() => {
  const lines: Lines<LineMetadata> = [];
  dataStore.histogramData.forEach((dataRow) => {
    // Each line needs to know its category for each categorical axis in use.
    const xCat = getDimensionCategory(appStore.dimensions.x, dataRow);
    const yCat = getDimensionCategory(appStore.dimensions.y, dataRow);
    const withinBandCat = getDimensionCategory(appStore.dimensions.withinBand, dataRow);

    const lowerBound = dataRow[HistCols.LOWER_BOUND];
    const upperBound = dataRow[HistCols.UPPER_BOUND];

    // barTopLeftPoint and barTopRightPoint are the top corners of the histogram bar representing the current row.
    const barTopLeftPoint = { x: lowerBound, y: dataRow[HistCols.COUNTS] };
    const barTopRightPoint = { x: upperBound, y: dataRow[HistCols.COUNTS] };

    // A point at y=0 to close off the histogram bar, which will be needed if either:
    // 1) this ends up being the last bar in the line, or
    // 2) there is a data gap until the next bar in this line.
    const closingOffPoint = { x: upperBound, y: 0 };

    // TODO: Store lines in a nested dict/map? That would save manually storing a set of xCategories/yCategories.
    // We need to plot at most one line for each of the combinations of dimensions in use.
    const line = lines.find(({ bands, metadata }: Lines<LineMetadata>[0]) => {
      return bands?.x === xCat && bands?.y === yCat && metadata?.withinBandAxisValue === withinBandCat
    });

    if (!line) {
      // The line does not already exist, so create it.

      // TODO: persist color on changing the axes etc, where applicable.
      lines.push({
        points: [
          { x: lowerBound, y: 0 },
          barTopLeftPoint,
          barTopRightPoint,
          closingOffPoint,
        ],
        bands: {
          ...(xCat ? { x: xCat } : {}),
          ...(yCat ? { y: yCat } : {}),
        },
        style: {
          strokeWidth: 0.5,
          opacity: 1,
          fillOpacity: 0.3,
        },
        metadata: withinBandCat ? { withinBandAxisValue: withinBandCat } : undefined,
        fill: true,
      });
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
      line.points.push(barTopLeftPoint, barTopRightPoint, closingOffPoint);
    }
  });

  return lines;
});

const filteredLines = computed(() => {
  return ridgeLines.value.filter(line => {
    return [Dimensions.LOCATION, Dimensions.DISEASE].every((dim) => {
      let lineValueForDimension: string | undefined;
      switch (dim) {
        case appStore.dimensions.x:
          lineValueForDimension = line.bands?.x;
          break;
        case appStore.dimensions.y:
          lineValueForDimension = line.bands?.y;
          break;
        case appStore.dimensions.withinBand:
          lineValueForDimension = line.metadata?.withinBandAxisValue;
          break;
      }
      const filter = appStore.filters[dim as keyof typeof appStore.filters];
      if (lineValueForDimension && filter.length) {
        return filter.includes(lineValueForDimension);
      } else {
        return true;
      }
    });
  });
});

const createChart = () => {
  if (!chartWrapper.value || filteredLines.value.length === 0) {
    return;
  }
  const minX = Math.min(...filteredLines.value.flatMap(l => l.points![0]?.x ?? 0));
  const maxX = Math.max(...filteredLines.value.flatMap(l => l.points[l.points.length - 1]!.x));
  const maxY = Math.max(...filteredLines.value.flatMap(l => Math.max(...l.points.map(p => p.y))));

  const numericalScales = {
    x: { start: appStore.logScaleEnabled ? minX : 0, end: maxX },
    y: { start: 0, end: maxY },
  };

  const xCategoricalScale = filteredLines.value.map(l => l.bands?.x).filter(c => !!c) as string[];
  const yCategoricalScale = filteredLines.value.map(l => l.bands?.y).filter(c => !!c) as string[];
  const categoricalScales = {
    ...(xCategoricalScale.length ? { x: xCategoricalScale } : {}),
    ...(yCategoricalScale.length ? { y: yCategoricalScale } : {}),
  };;

  const chart = new Chart()
    .addAxes({ x: "Impact ratio", y: titleCase(appStore.dimensions.y) })
    .addTraces(filteredLines.value)
    .addArea()
    // .addGridLines() // TODO: Enable gridlines only in x axis, pending release of https://github.com/mrc-ide/skadi-chart/pull/57
    // .addTooltips() // TODO: Enable tooltips once behaviour is satisfactory for area charts (vimc-8117)
    .makeResponsive()

  if (Object.values(categoricalScales).length !== 2) {
    chart.addZoom();
  }

  chart.appendTo(chartWrapper.value, numericalScales, {}, categoricalScales);
};

watch([filteredLines, chartWrapper], createChart);
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

<template>
  <div class="chart-container">
    <p v-if="linesToDisplay.length === 0" class="m-auto">
      <!-- E.g. Focus disease MenA, without splitting by activity type. -->
      No data available for the selected options.
    </p>
    <div
      v-else
      ref="chartWrapper"
      id="chartWrapper"
      :data-test="JSON.stringify({
        histogramDataRowCount: dataStore.histogramData.length,
        lineCount: linesToDisplay.length,
        ...appStore.dimensions,
      })"
    />
    <p v-if="dataStore.fetchErrors.length" class="mt-auto">
      {{ dataStore.fetchErrors.map(error => error.message).join(', ') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { debounce } from 'perfect-debounce';
import { Chart } from '@reside-ic/skadi-chart';
import { getDimensionCategoryValue } from '@/utils/fileParse';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import { useColorStore } from '@/stores/colorStore';
import { Axes, Dimensions, HistCols, type HistDataRow, type PointWithMetadata } from '@/types';
import titleCase from '@/utils/titleCase';
import useHistogramLines from '@/composables/useHistogramLines';
import { dimensionOptionLabel } from '@/utils/options';

const appStore = useAppStore();
const dataStore = useDataStore();
const colorStore = useColorStore();

const chartWrapper = ref<HTMLDivElement | null>(null);

const data = computed(() => {
  return dataStore.histogramData.filter(dataRow =>
    [Dimensions.LOCATION, Dimensions.DISEASE].every(dim => {
      const dimensionVal = getDimensionCategoryValue(dim, dataRow);
      return appStore.filters[dim]?.includes(dimensionVal);
    })
  )
});

const { ridgeLines } = useHistogramLines(data, () => appStore.dimensions, getDimensionCategoryValue, dimensionOptionLabel);

// TODO: (vimc-9191) order the plot rows by the mean of means.
const linesToDisplay = computed(() => {
  // Only filter plot rows if each row represents a disease.
  if (appStore.dimensions[Axes.ROW] !== Dimensions.DISEASE || appStore.dimensions[Axes.WITHIN_BAND] !== Dimensions.LOCATION) {
    return ridgeLines.value;
  };

  return ridgeLines.value.filter((line) => {
    // If data for a disease is not present at the same geographical resolution as the focus, we should exclude the disease from the plot.
    // E.g. Say the focus value is 'Djibouti', a location. If for some row of ridgelines - where rows are diseases, such as Malaria -
    // there is no line for Djibouti, we should exclude the Malaria row entirely so that we only display rows that are relevant for Djibouti.
    const disease = line.metadata?.[Axes.ROW];
    const locationsForDisease = ridgeLines.value
      .filter(l => l.metadata?.[Axes.ROW] === disease)
      .map(({ metadata }) => metadata?.withinBand);
    return locationsForDisease.includes(appStore.focus);
  });
})

// Debounce chart updates so that there is no flickering if filters change at a different moment from focus/dimensions.
const updateChart = debounce(() => {
  if (linesToDisplay.value.length === 0 || !chartWrapper.value) {
    return;
  }

  colorStore.setColors(linesToDisplay.value);

  linesToDisplay.value.forEach(line => {
    // TODO: Once we have implemented ordering the categories, ensure that this ordering is reflected in
    // the color assignment, since the palettes maximize contrast between _neighboring_ colors.
    const { fillColor, fillOpacity, strokeColor, strokeOpacity } = colorStore.getColorsForLine(line.metadata!);

    line.style = { strokeWidth: 1, opacity: strokeOpacity, fillOpacity, strokeColor, fillColor };
  });

  const minX = Math.min(...linesToDisplay.value.flatMap(l => l.points![0]?.x ?? 0));
  const maxX = Math.max(...linesToDisplay.value.flatMap(l => l.points[l.points.length - 1]!.x));
  const maxY = Math.max(...linesToDisplay.value.flatMap(l => Math.max(...l.points.map(p => p.y))));

  const numericalScales = {
    x: { start: appStore.logScaleEnabled ? minX : 0, end: maxX },
    y: { start: 0, end: maxY },
  };

  const xCategoricalScale = linesToDisplay.value.map(l => l.bands?.x).filter(c => !!c) as string[];
  // TODO: Implement an ordering for the row categories, depending on the mean of means.
  const yCategoricalScale = linesToDisplay.value.map(l => l.bands?.y).filter(c => !!c) as string[];
  const categoricalScales = {
    ...(xCategoricalScale.length ? { x: xCategoricalScale } : {}),
    ...(yCategoricalScale.length ? { y: yCategoricalScale } : {}),
  };

  // A callback function used in skadi-chart tick formatting. Setting it as undefined
  // lets skadi-chart use its default number formatting.
  const numberFormatter = appStore.logScaleEnabled ? (num: number): string => {
    const [mantissa, exponent] = num.toExponential().split("e");
    return `${mantissa === "1" ? `` : `${mantissa}×`}10^${exponent?.replace("+", "")}`;
  } : undefined;

  // Option 1 of tooltips: Show the bounds for the points.
  // Option 2: Show the median/mean value (/95% confidence) for the whole line.

  // Each data row will have multiple related points (defining the envelope of the row's histogram bin).
  // Look up the data row for the point, so that we can show the lower and upper bounds in the tooltip,
  // as opposed to just the x value of the point (which may be either the lower or upper bound).
  const tooltipImpactRatioFormatter = (point: PointWithMetadata): string => {
    if (!appStore.logScaleEnabled) {
      return point.x.toPrecision(4);
    }

    const matchingDataRows = data.value.filter(dataRow => {
      return [dataRow[HistCols.LOWER_BOUND], dataRow[HistCols.UPPER_BOUND]].includes(point.x)
        && [0, dataRow[HistCols.COUNTS]].includes(point.y)
        && Object.values(appStore.dimensions).every(dim => {
          const axis = appStore.getAxisForDimension(dim);
          if (!axis || !dim || !dataRow[dim]) return true;
          return dataRow[dim] === point.metadata?.[axis];
        });
    });

    let dataRowForPoint: HistDataRow | undefined;

    if (matchingDataRows.length === 0) {
      alert(`Did not find data row for point ${JSON.stringify(point)}
        \n\n Here are some candidate points: \n\n ${data.value.filter(dataRow => {
          return [dataRow[HistCols.LOWER_BOUND], dataRow[HistCols.UPPER_BOUND]].includes(point.x)
        }).map(dr => JSON.stringify(dr)).join('\n')}`
      );
    } else if (matchingDataRows.length === 2
    // If two matching data rows are found, check that they are contiguous.
      && (matchingDataRows[0]?.[HistCols.LOWER_BOUND] === matchingDataRows[1]?.[HistCols.UPPER_BOUND]
        || matchingDataRows[0]?.[HistCols.UPPER_BOUND] === matchingDataRows[1]?.[HistCols.LOWER_BOUND])
    ) {
      // Choose the first, arbitrarily.
      dataRowForPoint = matchingDataRows[0];
    } else if (matchingDataRows.length > 2) {
      alert(`Found more than two data rows for point ${JSON.stringify(point)}: ${JSON.stringify(matchingDataRows)}`);
    } else if (matchingDataRows.length === 1) {
      dataRowForPoint = matchingDataRows[0];
    }

    const [lowerBound, upperBound] = [dataRowForPoint?.[HistCols.LOWER_BOUND], dataRowForPoint?.[HistCols.UPPER_BOUND]].map(num => {
      if (num === undefined) alert ("huh???");
      return numberFormatter ? numberFormatter(Number(num)) : Number(num).toPrecision(4);
    });

    return `Bounds: <strong>${lowerBound}</strong> to <strong>${upperBound}</strong>`;
  };

  const tooltipHtmlCallback = (point: PointWithMetadata) => {
    if (!point.metadata) return "";

    const { fillColor } = colorStore.getColorsForLine(point.metadata!)

    return `<div class="tooltip text-xs flex flex-col gap-1">
      <div class="flex gap-1 items-center">
        <span style="color:${fillColor}; font-size: 1.3rem;" class=>●</span>
        <span class="mt-1 flex flex-wrap gap-5">
          <span>
            ${titleCase(colorStore.colorDimension)}: <strong>${dimensionOptionLabel(colorStore.colorDimension, point.metadata?.[colorStore.colorAxis])}</strong>
          </span>
          <span>
            Count: <strong>${point.y}</strong>
          </span>
        </span>
      </div>
      <p>
        ${tooltipImpactRatioFormatter(point)}
      </p>
    </div>`
  }

  const yAxisNeedsMuchSpace = appStore.dimensions[Axes.ROW] === Dimensions.LOCATION;

  const chart = new Chart({
    tickConfig: {
      numerical: { x: { formatter: numberFormatter } },
      categorical: { y: { padding: yAxisNeedsMuchSpace ? 10 : 30, rotate: yAxisNeedsMuchSpace ? 30 : 0 } },
    },
  }).addAxes({
      x: "Impact ratio",
      y: titleCase(appStore.dimensions[Axes.ROW]),
    }, {
      y: 0 // Position y-axis label as far left as possible
    })
    .addTraces(linesToDisplay.value)
    .addArea()
    .addGridLines({ x: !appStore.dimensions[Axes.COLUMN], y: false })
    .addTooltips(tooltipHtmlCallback, Infinity, "x")
    .makeResponsive()

  if (Object.values(categoricalScales).length !== 2) {
    chart.addZoom();
  }

  const margins = { left: yAxisNeedsMuchSpace ? 170 : 100 }; // Leave space for long y-axis labels.

  chart.appendTo(chartWrapper.value, numericalScales, {}, categoricalScales, margins);
}, 100);

watch([linesToDisplay, () => appStore.focus, chartWrapper], updateChart, { immediate: true });
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

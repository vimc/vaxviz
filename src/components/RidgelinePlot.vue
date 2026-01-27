<template>
  <div class="chart-container">
    <div v-if="dataStore.isLoading" role="status" aria-live="polite" aria-label="Loading data">
      <FwbSpinner class="m-auto" size="8" />
      <span class="sr-only">Loading data...</span>
    </div>
    <div v-else-if="dataStore.fetchErrors.length" role="alert" aria-live="assertive">
      <FetchErrorAlert />
    </div>
    <p v-else-if="noDataToDisplay" class="m-auto" role="status" aria-live="polite">
      <!-- E.g. Focus disease MenA, without splitting by activity type. -->
      No data available for the selected options.
    </p>
    <figure
      v-else
      ref="chartWrapper"
      id="chartWrapper"
      :aria-label="chartAriaLabel"
      :data-test="JSON.stringify({
        histogramDataRowCount: dataStore.histogramData.length,
        lineCount: relevantRidgeLines.length,
        ...appStore.dimensions,
      })"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { debounce } from 'perfect-debounce';
import { FwbSpinner } from 'flowbite-vue';
import { Chart } from '@reside-ic/skadi-chart';
import { getDimensionCategoryValue } from '@/utils/fileParse';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import { useColorStore } from '@/stores/colorStore';
import { Axis, Dimension, SummaryTableColumn } from '@/types';
import useHistogramLines from '@/composables/useHistogramLines';
import { dimensionOptionLabel } from '@/utils/options';
import { plotConfiguration, TOOLTIP_RADIUS_PX } from '@/utils/plotConfiguration';
import usePlotTooltips from '@/composables/usePlotTooltips';
import FetchErrorAlert from '@/components/FetchErrorAlert.vue';

const appStore = useAppStore();
const dataStore = useDataStore();
const colorStore = useColorStore();
const { tooltipCallback } = usePlotTooltips();

const chartWrapper = ref<HTMLDivElement | null>(null);
// noDataToDisplay is a ref rather than computed so that we can debounce updates to it, preventing flickering
// if appStore changes at a different moment from linesToDisplay.
const noDataToDisplay = ref<boolean>(false);

const chartAriaLabel = computed(() => {
  const focus = dimensionOptionLabel(appStore.exploreBy, appStore.focus);
  const metric = appStore.burdenMetric;
  return `Ridgeline chart showing ${metric} data for ${focus}. ${sortedRidgeLines.value.length} data series displayed.`;
});

const data = computed(() => dataStore.histogramData.filter(dataRow =>
  [Dimension.LOCATION, Dimension.DISEASE].every(dim => {
    const dimensionVal = getDimensionCategoryValue(dim, dataRow);
    return appStore.filters[dim]?.includes(dimensionVal);
  })),
);

const { ridgeLines } = useHistogramLines(data, () => appStore.dimensions, getDimensionCategoryValue, dimensionOptionLabel);

// Here, we filter ridgelines on the basis of their relevance to the 'focus' selection.
// This is distinct from any filtering the user may apply on top of this using plot controls,
// and indeed also from the implicit filtering based on the choice of dimensions (as handled by appStore).
const relevantRidgeLines = computed(() => {
  // Only filter plot rows for relevance if each row represents a disease.
  if (appStore.dimensions[Axis.ROW] !== Dimension.DISEASE || appStore.dimensions[Axis.WITHIN_BAND] !== Dimension.LOCATION) {
    return ridgeLines.value;
  };

  return ridgeLines.value.filter((line) => {
    // If data for a disease is not present at the same geographical resolution as the focus, we should exclude the disease from the plot.
    // E.g. Say the focus value is 'Djibouti', a location. For some row of ridgelines - where rows are diseases, such as Malaria -
    // there may be data available at a global and/or subregional level, but none for Djibouti. In such cases we should exclude the
    // Malaria row entirely so that we only display rows that are relevant for Djibouti.
    const disease = line.metadata?.[Axis.ROW];
    const locationsForDisease = ridgeLines.value
      .filter(l => l.metadata?.[Axis.ROW] === disease)
      .map(({ metadata }) => metadata?.withinBand);
    return locationsForDisease.includes(appStore.focus);
  });
});

// A plot-row may contain multiple ridgelines.
// Return the mean of the means for all ridgelines in the plot row.
// The plot row is specified by its category along the relevant dimension, e.g. 'Djibouti' (a location) or 'Malaria' (a disease).
const getMeanOfMeansForPlotRow = (plotRowCategory?: string) => {
  const ridgelinesForPlotRow = relevantRidgeLines.value.filter(line => line.metadata?.[Axis.ROW] === plotRowCategory);
  const meanValues = ridgelinesForPlotRow.map(({ metadata }) => {
    const dataTableRow = dataStore.getSummaryDataRow(metadata!)!;
    return dataTableRow[SummaryTableColumn.MEAN];
  });
  return meanValues.reduce((sum, val) => sum + val, 0) / meanValues.length;
};

const sortedRidgeLines = computed(() => {
  return relevantRidgeLines.value.toSorted((lineA, lineB) => {
    const meanA = getMeanOfMeansForPlotRow(lineA.metadata?.[Axis.ROW]);
    const meanB = getMeanOfMeansForPlotRow(lineB.metadata?.[Axis.ROW]);
    return meanA - meanB;
  });
});

// Debounce chart updates so that there is no flickering if filters change at a different moment from focus/dimensions.
const updateChart = debounce(() => {
  noDataToDisplay.value = sortedRidgeLines.value.length === 0;

  if (noDataToDisplay.value || !chartWrapper.value) {
    return;
  }

  colorStore.setColors(sortedRidgeLines.value);

  sortedRidgeLines.value.forEach(line => {
    // TODO: Once we have implemented ordering the categories, ensure that this ordering is reflected in
    // the color assignment, since the palettes maximize contrast between _neighboring_ colors.
    const { fillColor, fillOpacity, strokeColor, strokeOpacity } = colorStore.getColorsForLine(line.metadata!);

    line.style = { strokeWidth: 1, opacity: strokeOpacity, fillOpacity, strokeColor, fillColor };
  });

  const { constructorOptions, axisConfig, chartAppendConfig, categoricalScales } = plotConfiguration(
    appStore.dimensions[Axis.ROW],
    appStore.logScaleEnabled,
    sortedRidgeLines.value,
  );

  new Chart(constructorOptions)
    .addAxes(...axisConfig)
    .addTraces(sortedRidgeLines.value)
    .addArea()
    .addGridLines(
      {
        // TODO: vimc-9195: extend gridlines feature to work for categorical axes.
        x: !categoricalScales.x?.length,
        y: false,
      },
    )
    .addTooltips(tooltipCallback, TOOLTIP_RADIUS_PX)
    .makeResponsive()
    .appendTo(chartWrapper.value, ...chartAppendConfig);
}, 100);

watch([relevantRidgeLines, () => appStore.focus, chartWrapper], updateChart, { immediate: true });
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

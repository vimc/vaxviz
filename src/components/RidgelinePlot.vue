<template>
  <div class="chart-container min-h-0 flex-1 flex">
    <FwbSpinner v-if="dataStore.isLoading" class="m-auto" size="8" />
    <FetchErrorAlert v-else-if="dataStore.fetchErrors.length" />
    <p v-else-if="noDataToDisplay" class="m-auto">
      <!-- E.g. Focus disease MenA, without splitting by activity type. -->
      No data available for the selected options.
    </p>
    <div
      v-else
      ref="chartWrapper"
      id="chartWrapper"
      :data-test="JSON.stringify({
        histogramDataRowCount: dataStore.histogramData.length,
        lineCount: selectedLines.length,
        ...appStore.dimensions,
      })"
      class="flex-1 m-10"
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
import useConfidenceIntervals from '@/composables/useConfidenceIntervals';
import FetchErrorAlert from '@/components/FetchErrorAlert.vue';

const appStore = useAppStore();
const dataStore = useDataStore();
const colorStore = useColorStore();
const { tooltipCallback } = usePlotTooltips();

const chartWrapper = ref<HTMLDivElement>();
// noDataToDisplay is a ref rather than computed so that we can debounce updates to it, preventing flickering
// if appStore changes at a different moment from linesToDisplay.
const noDataToDisplay = ref<boolean>(false);

const data = computed(() => dataStore.histogramData.filter(dataRow =>
  [Dimension.LOCATION, Dimension.DISEASE].every(dim => {
    const dimensionVal = getDimensionCategoryValue(dim, dataRow);
    return appStore.filters[dim]?.includes(dimensionVal);
  })),
);

const summaryTableData = computed(() => {
  const filteredData = dataStore.summaryTableData.filter(dataRow =>
    [Dimension.LOCATION, Dimension.DISEASE].every(dim => {
      const dimensionVal = getDimensionCategoryValue(dim, dataRow);
      return appStore.filters[dim]?.includes(dimensionVal);
    })
  );
  
  if (!appStore.logScaleEnabled) {
    return filteredData;
  }

  return filteredData.map(row => {
    // log10 of 0 or a negative number is -Infinity or NaN.
    const log10CiLower = row[SummaryTableColumn.CI_LOWER] > 0 ? Math.log10(row[SummaryTableColumn.CI_LOWER]) : -10;
    const log10CiUpper = row[SummaryTableColumn.CI_UPPER] > 0 ? Math.log10(row[SummaryTableColumn.CI_UPPER]) : -10;
    const log10Median = row[SummaryTableColumn.MEDIAN] > 0 ? Math.log10(row[SummaryTableColumn.MEDIAN]) : -10;
    const log10Mean = row[SummaryTableColumn.MEAN] > 0 ? Math.log10(row[SummaryTableColumn.MEAN]) : -10;
    if (isNaN(log10CiLower) || !isFinite(log10CiLower) || isNaN(log10CiUpper) || !isFinite(log10CiUpper) || isNaN(log10Median) || !isFinite(log10Median) || isNaN(log10Mean) || !isFinite(log10Mean)) {
      return undefined;
    }
    return {
      ...row,
      [SummaryTableColumn.CI_LOWER]: log10CiLower,
      [SummaryTableColumn.CI_UPPER]: log10CiUpper,
      [SummaryTableColumn.MEDIAN]: log10Median,
      [SummaryTableColumn.MEAN]: log10Mean,
    };
  }).filter(row => row !== undefined);
});

const { constructLines } = useHistogramLines(data, () => appStore.dimensions, getDimensionCategoryValue, dimensionOptionLabel);
const ridgeLines = computed(() => dataStore.isLoading ? [] : constructLines());

// Here, we filter ridgelines on the basis of their relevance to the 'focus' selection.
// This is distinct from any filtering the user may apply on top of this using plot controls,
// and indeed also from the implicit filtering based on the choice of dimensions (as handled by appStore).
const relevantRidgeLines = computed(() => {
  // Only filter plot rows for relevance if each row represents a disease.
  if (appStore.dimensions[Axis.ROW] !== Dimension.DISEASE || appStore.dimensions[Axis.WITHIN_BAND] !== Dimension.LOCATION) {
    return ridgeLines.value;
  };

  return ridgeLines.value.filter((line) => {
    // If data for a disease is not present at the same geographical resolution as the focus, we should consider the disease irrelevant
    // and exclude it from the plot.
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

const sortedRidgeLines = computed(() => relevantRidgeLines.value.toSorted((lineA, lineB) => {
  const meanA = getMeanOfMeansForPlotRow(lineA.metadata?.[Axis.ROW]);
  const meanB = getMeanOfMeansForPlotRow(lineB.metadata?.[Axis.ROW]);
  return meanA - meanB;
}));

// Apply the filtering specified by the legend selections.
const selectedLines = computed(() => sortedRidgeLines.value.filter(line => {
  const colorVal = line.metadata?.[colorStore.colorAxis];
  return colorVal && appStore.legendSelections[colorStore.colorDimension]?.includes(colorVal);
}));

const { confidenceIntervalLines } = useConfidenceIntervals(summaryTableData, selectedLines, getDimensionCategoryValue, dimensionOptionLabel);

const ciLinesToDisplay = computed(() => {
  // Only filter plot rows if each row represents a disease.
  if (appStore.dimensions[Axis.ROW] !== Dimension.DISEASE || appStore.dimensions[Axis.WITHIN_BAND] !== Dimension.LOCATION) {
    return confidenceIntervalLines.value;
  };

  return confidenceIntervalLines.value.filter((line) => {
    // If data for a disease is not present at the same geographical resolution as the focus, we should exclude the disease from the plot.
    // E.g. Say the focus value is 'Djibouti', a location. If for some row of ridgelines - where rows are diseases, such as Malaria -
    // there is no line for Djibouti, we should exclude the Malaria row entirely so that we only display rows that are relevant for Djibouti.
    const disease = line.metadata?.[Axis.ROW];
    const locationsForDisease = confidenceIntervalLines.value
      .filter(l => l.metadata?.[Axis.ROW] === disease)
      .map(({ metadata }) => metadata?.withinBand);
    return locationsForDisease.includes(appStore.focus);
  });
});

// Debounce chart updates so that there is no flickering if filters change at a different moment from focus/dimensions.
const updateChart = debounce(() => {
  noDataToDisplay.value = selectedLines.value.length === 0;

  if (noDataToDisplay.value || !chartWrapper.value) {
    return;
  }

  // Set colors using unfiltered ridgelines, since filtered-out lines are still rendered by the
  // ColorLegend as options to be toggled back on.
  colorStore.setColors(sortedRidgeLines.value);

  selectedLines.value.forEach(line => {
    const { fillColor, fillOpacity, strokeColor, strokeOpacity } = colorStore.getColorsForLine(line.metadata!);

    line.style = { strokeWidth: 1, opacity: strokeOpacity, fillOpacity, strokeColor, fillColor };
  });

  ciLinesToDisplay.value.forEach(line => {
    const { fillColor } = colorStore.getColorsForLine(line.metadata!);

    line.style = { strokeWidth: 0, strokeColor: fillColor, fillColor: fillColor, fillOpacity: 0.7 };
  });

  const { constructorOptions, axisConfig, chartAppendConfig, categoricalScales } = plotConfiguration(
    appStore.dimensions[Axis.ROW],
    appStore.logScaleEnabled,
    selectedLines.value,
  );

  new Chart(constructorOptions)
    .addAxes(...axisConfig)
    .addTraces(selectedLines.value.concat(ciLinesToDisplay.value))
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
}, 25);

watch([selectedLines, chartWrapper], updateChart, { immediate: true });
</script>


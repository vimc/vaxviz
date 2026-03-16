<template>
  <div class="flex-1 min-w-0 h-full max-h-full flex flex-col gap-y-5 mx-10">
    <div class="chart-container flex-1 min-h-0 w-full">
      <FwbSpinner v-if="dataStore.isLoading" class="m-auto" size="8" />
      <DataErrorAlert v-else-if="dataStore.dataErrors.length" />
      <FwbAlert v-else-if="noDataToDisplay" icon class="w-fit m-auto mt-10">
        <span v-if="appStore.focuses.length && appStore.focuses.every(f => meningitisVaccines.includes(f)) && !appStore.splitByActivityType">
          Estimates for {{ appStore.focuses.join(", ") }} are only available at the activity type (campaign/routine) level.<br/>
          Try selecting ‘Split by activity type’, or view ‘Meningitis’ estimates (a composite of MenA and MenACWYX).
        </span>
        <span v-else-if="appStore.focuses[0] === 'Meningitis' && appStore.focuses.length === 1 && appStore.splitByActivityType">
          Estimates for Meningitis are not available at the activity type (campaign/routine) level.<br/>
          Try de-selecting ‘Split by activity type’, or view the estimates for MenA/MenACWYX vaccines.
        </span>
        <span v-else>
          No estimates available for the selected options.
        </span>
      </FwbAlert>
      <div
        v-else
        ref="chartWrapper"
        id="chartWrapper"
        :data-test="JSON.stringify({
          histogramDataRowCount: dataStore.histogramData.length,
          lineCount: selectedLines.length,
          ...appStore.dimensions,
        })"
      />
    </div>
    <div
      v-if="!noDataToDisplay && !dataStore.dataErrors.length"
      id="legendContainer"
      class="mb-5 w-fit max-xl:ml-10!"
      :style="{ 'margin-left': `${plotLeftMargin}px` }"
    >
      <FwbAlert v-if="legendWarnings.length" class="w-fit mb-5" icon>
        <div class="flex flex-col gap-y-1">
          <p v-for="(warning, index) in legendWarnings" :key="index">
            {{ warning }}
          </p>
        </div>
      </FwbAlert>
      <ColorLegend v-if="colorStore.colorMapping.size >= 2 || focusesWithoutData.length"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { debounce } from 'perfect-debounce';
import { FwbAlert, FwbSpinner } from 'flowbite-vue';
import { Chart, type Scales } from '@reside-ic/skadi-chart';
import { getDimensionCategoryValue } from '@/utils/fileParse';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import { useColorStore } from '@/stores/colorStore';
import { useHelpInfoStore } from '@/stores/helpInfoStore';
import { Axis, Dimension, SummaryTableColumn } from '@/types';
import useHistogramLines from '@/composables/useHistogramLines';
import { dimensionOptionLabel, meningitisVaccines } from '@/utils/options';
import { plotConfiguration, TOOLTIP_RADIUS_PX } from '@/utils/plotConfiguration';
import usePlotTooltips from '@/composables/usePlotTooltips';
import ColorLegend from '@/components/ColorLegend.vue';
import DataErrorAlert from '@/components/DataErrorAlert.vue';
import { getSubregionFromCountry } from '@/utils/regions';

const appStore = useAppStore();
const dataStore = useDataStore();
const colorStore = useColorStore();
const helpInfoStore = useHelpInfoStore();
const { tooltipCallback } = usePlotTooltips();

const chartWrapper = ref<HTMLDivElement>();
const plotLeftMargin = ref<number>(0);
// noDataToDisplay and focusesWithoutData are refs rather than computeds so that we can debounce updates to them, preventing flickering
// if appStore changes at a different moment from linesToDisplay.
const noDataToDisplay = ref<boolean>(false); // Whether there are no lines to display after applying all filters, or equivalently whether the chart would be empty.
const focusesWithoutData = ref<string[]>([]); // Any focus values for which there are no lines to display after applying all filters.

const legendWarnings = computed(() => {
  const warnings = [];
  if (appStore.focuses.some(f => meningitisVaccines.includes(f)) && !appStore.splitByActivityType) {
    warnings.push("Estimates for meningitis vaccines (MenA/MenACWYX) are only available at the activity type (campaign/routine) level.");
  } else if (appStore.focuses.includes('Meningitis') && appStore.splitByActivityType) {
    warnings.push("Estimates for ‘Meningitis’ are not available at the activity type (campaign/routine) level.");
  }
  if (focusesWithoutData.value.length) {
    warnings.push(`No estimates available with current options for the following focus selection(s): ${focusesWithoutData.value.join(", ")}.`);
  }
  return warnings;
});

const data = computed(() => dataStore.histogramData.filter(dataRow =>
  [Dimension.LOCATION, Dimension.DISEASE].every(dim => {
    const dimensionVal = getDimensionCategoryValue(dim, dataRow);
    return appStore.filters[dim]?.includes(dimensionVal);
  })),
);

const { constructLines } = useHistogramLines(data, () => appStore.dimensions, getDimensionCategoryValue, dimensionOptionLabel);
const ridgeLines = computed(() => dataStore.isLoading ? [] : constructLines());

// Here, we filter ridgelines on the basis of their relevance to the 'focus' selection(s).
// This is distinct from any filtering the user may apply on top of this using plot controls,
// and indeed also from the implicit filtering based on the choice of dimensions (as handled by appStore).
const relevantRidgeLines = computed(() => {
  // Only filter plot rows for relevance if each row represents a disease, and there is exactly one focus location.
  const eachRowRepresentsADisease = appStore.dimensions[Axis.ROW] === Dimension.DISEASE && appStore.dimensions[Axis.WITHIN_BAND] === Dimension.LOCATION;
  if (appStore.focuses.length !== 1 || !eachRowRepresentsADisease) {
    return ridgeLines.value;
  };
  
  // If data for a disease does not exist for the focused location, nor the corresponding subregion,
  // we should consider the disease irrelevant and exclude its entire row from the plot.
  // E.g. Say the focus value is 'Afghanistan'. For some row of ridgelines (where rows are diseases, such as malaria)
  // there may be data available at a global level, but none for Afghanistan or its subregion Southern Asia.
  // In such cases we should consider the malaria row irrelevant to the focus location, and exclude all the lines within the row,
  // Check if any of the locations for the current line's disease match either the focus location or its subregion.
  const focusLocation = appStore.focuses[0];
  return ridgeLines.value.filter((line) => {
    const disease = line.metadata?.[Axis.ROW];
    const locationsForDisease = ridgeLines.value
      .filter(l => l.metadata?.[Axis.ROW] === disease) // Get all lines whose disease matches that of the current line.
      .map(({ metadata }) => metadata?.withinBand); // Look up their locations.
      // Check if any of the locations for the current line's disease match either the focus location or its subregion.
      return [focusLocation, getSubregionFromCountry(focusLocation)].some(loc => locationsForDisease.includes(loc));
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

const updateHelpInfo = (numericalScales: Scales) => {
  if (!appStore.logScaleEnabled && numericalScales.x.start < 0) {
    const delayMs = helpInfoStore.helpInfoShowCounts.negativeValues <= 1
     ? 5000
     : 0;

    helpInfoStore.show('negativeValues', delayMs);
  } else {
    helpInfoStore.unShow('negativeValues');
  };
}

// Debounce chart updates so that there is no flickering if filters change at a different moment from focus/dimensions.
const updateChart = debounce(() => {
  const categoriesInUse = relevantRidgeLines.value.flatMap(line => Object.keys(appStore.dimensions).map(axis => line.metadata?.[axis as Axis]));
  focusesWithoutData.value = appStore.focuses.filter(focus => !categoriesInUse.includes(focus));

  noDataToDisplay.value = selectedLines.value.length === 0;
  if (noDataToDisplay.value || !chartWrapper.value) {
    colorStore.setColors([]); // Remove color legend when there is no data to display
    return;
  };

  // Set colors using unfiltered ridgelines, since filtered-out lines are still rendered by the
  // ColorLegend as options to be toggled back on.
  colorStore.setColors(sortedRidgeLines.value);

  const lines = selectedLines.value.map(line => {
    const { fillColor, fillOpacity, strokeColor, strokeOpacity } = colorStore.getColorsForLine(line.metadata!);

    return { ...line, style: { strokeWidth: 1, opacity: strokeOpacity, fillOpacity, strokeColor, fillColor } };
  });

  const { constructorOptions, axisConfig, chartAppendConfig, numericalScales } = plotConfiguration(
    appStore.dimensions[Axis.ROW],
    appStore.logScaleEnabled,
    lines,
  );

  updateHelpInfo(numericalScales);

  new Chart(constructorOptions)
    .addAxes(...axisConfig)
    .addTraces(lines)
    .addArea()
    .addGridLines({ y: { enabled: false } })
    .addTooltips(tooltipCallback, TOOLTIP_RADIUS_PX)
    .makeResponsive()
    .appendTo(chartWrapper.value, ...chartAppendConfig);

  // Align the left edge of the legend with that of the plot.
  plotLeftMargin.value = chartAppendConfig[3].left || 0;
}, 25);

watch([selectedLines, chartWrapper], updateChart, { immediate: true });
</script>

<style lang="scss" scoped>
#chartWrapper {
  width: 100%;
  height: 100%;
  margin: 0;
}
</style>

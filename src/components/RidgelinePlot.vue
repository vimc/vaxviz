<template>
  <div class="chart-container">
    <FetchErrorAlert v-if="dataStore.fetchErrors.length" />
    <p v-else-if="linesToDisplay.length === 0" class="m-auto">
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
import { Axis, Dimension } from '@/types';
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

const data = computed(() => dataStore.histogramData.filter(dataRow =>
  [Dimension.LOCATION, Dimension.DISEASE].every(dim => {
    const dimensionVal = getDimensionCategoryValue(dim, dataRow);
    return appStore.filters[dim]?.includes(dimensionVal);
  })),
);

const { ridgeLines } = useHistogramLines(data, () => appStore.dimensions, getDimensionCategoryValue, dimensionOptionLabel);

// TODO: (vimc-9191) order the plot rows by the mean of means.
const linesToDisplay = computed(() => {
  // Only filter plot rows if each row represents a disease.
  if (appStore.dimensions[Axis.ROW] !== Dimension.DISEASE || appStore.dimensions[Axis.WITHIN_BAND] !== Dimension.LOCATION) {
    return ridgeLines.value;
  };

  return ridgeLines.value.filter((line) => {
    // If data for a disease is not present at the same geographical resolution as the focus, we should exclude the disease from the plot.
    // E.g. Say the focus value is 'Djibouti', a location. If for some row of ridgelines - where rows are diseases, such as Malaria -
    // there is no line for Djibouti, we should exclude the Malaria row entirely so that we only display rows that are relevant for Djibouti.
    const disease = line.metadata?.[Axis.ROW];
    const locationsForDisease = ridgeLines.value
      .filter(l => l.metadata?.[Axis.ROW] === disease)
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

  const { tickConfig, axisConfig, chartAppendConfig } = plotConfiguration(
    appStore.dimensions[Axis.ROW],
    appStore.logScaleEnabled,
    linesToDisplay.value,
  );

  new Chart({ tickConfig })
    .addAxes(...axisConfig)
    .addTraces(linesToDisplay.value)
    .addArea()
    .addGridLines(
      {
        // TODO: vimc-9195: extend gridlines feature to work for categorical axes.
        x: !appStore.dimensions[Axis.COLUMN],
        y: false,
      },
    )
    .addTooltips(tooltipCallback, TOOLTIP_RADIUS_PX)
    .makeResponsive()
    .appendTo(chartWrapper.value, ...chartAppendConfig);
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

  // Use Google Sans Flex for chart text because, in this font, there is tolerable height-alignment and size-matching
  // among Unicode superscript numerals and negative signs.
  * {
    font-family: 'Google Sans Flex', sans-serif;
  }
}
</style>

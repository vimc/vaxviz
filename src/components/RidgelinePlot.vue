<template>
  <div class="chart-container">
    <FwbSpinner v-if="dataStore.isLoading" class="m-auto" size="12" />
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
        lineCount: linesToDisplay.length,
        ...appStore.dimensions,
      })"
    />
    <p v-if="dataStore.fetchErrors.length" class="mt-auto">
      {{ dataStore.fetchErrors.map(error => error.message).join(', ') }}
    </p>
    <!-- Legend for manual testing only -->
    <!-- <div v-if="colorStore.colorMapping && colorStore.colorMapping.size >= 2">
      <h3>Legend, for manual testing only</h3>
      <ul>
        <li
          v-for="([value, color]) in colorStore.colorMapping"
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
    </div> -->
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
import { Axes, Dimensions } from '@/types';
import titleCase from '@/utils/titleCase';
import useHistogramLines from '@/composables/useHistogramLines';
import { dimensionOptionLabel } from '@/utils/options';

const appStore = useAppStore();
const dataStore = useDataStore();
const colorStore = useColorStore();

const chartWrapper = ref<HTMLDivElement | null>(null);
// noDataToDisplay is a ref rather than computed so that we can debounce updates to it, preventing flickering
// if appStore changes at a different moment from linesToDisplay.
const noDataToDisplay = ref<boolean>(false);

const data = () => {
  return dataStore.histogramData.filter(dataRow =>
    [Dimensions.LOCATION, Dimensions.DISEASE].every(dim => {
      const dimensionVal = getDimensionCategoryValue(dim, dataRow);
      return appStore.filters[dim]?.includes(dimensionVal);
    })
  )
};

const { ridgeLines } = useHistogramLines(data, () => appStore.dimensions, getDimensionCategoryValue, dimensionOptionLabel);

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
  noDataToDisplay.value = linesToDisplay.value.length === 0;

  if (noDataToDisplay.value || !chartWrapper.value) {
    return;
  }

  colorStore.setColors(linesToDisplay.value);

  linesToDisplay.value.forEach(line => {
    // TODO: Once we have implemented ordering the categories, ensure that this ordering is reflected in
    // the color assignment, since the palettes maximize contrast between _neighboring_ colors.
    const { fillColor, strokeColor } = colorStore.getColorsForLine(line.metadata!);
    // Keep `fillOpacity` value low since mixing translucent colours creates
    // a third color, and hence the illusion of an extra ridgeline.
    line.style = {
      strokeWidth: 1,
      opacity: 1,
      fillOpacity: 0.2,
      strokeColor,
      fillColor,
    };
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

  const chart = new Chart()
    .addAxes({
      // TODO: Put the 10^n into the tick labels, pending release of https://github.com/mrc-ide/skadi-chart/pull/65
      x: appStore.logScaleEnabled ? "Impact ratio (10^n)" : "Impact ratio",
      y: titleCase(appStore.dimensions[Axes.ROW]),
    })
    .addTraces(linesToDisplay.value)
    .addArea()
    .addGridLines({ x: !appStore.dimensions[Axes.COLUMN], y: false })
    // .addTooltips() // TODO: Enable tooltips once behaviour is satisfactory for area charts (vimc-8117)
    .makeResponsive()

  if (Object.values(categoricalScales).length !== 2) {
    chart.addZoom();
  }

  chart.appendTo(chartWrapper.value, numericalScales, {}, categoricalScales);
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

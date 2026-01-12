<template>
  <div class="chart-container">
    <p v-if="relevantLines.length === 0" class="m-auto">
      <!-- E.g. Focus disease MenA, without splitting by activity type. -->
      No data available for the selected options.
    </p>
    <div
      v-else
      ref="chartWrapper"
      id="chartWrapper"
      :data-test="JSON.stringify({
        histogramDataRowCount: dataStore.histogramData.length,
        lineCount: relevantLines.length,
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
import { Axes, Dimensions } from '@/types';
import titleCase from '@/utils/titleCase';
import useHistogramLines from '@/composables/useHistogramLines';
import { dimensionOptionLabel } from '@/utils/options';

const appStore = useAppStore();
const dataStore = useDataStore();
const colorStore = useColorStore();

const chartWrapper = ref<HTMLDivElement | null>(null);

// `data` applies the top-level, 'hard' filters, for passing to the useHistogramLines composable.
const data = () => {
  return dataStore.histogramData.filter(dataRow =>
    [Dimensions.LOCATION, Dimensions.DISEASE].every(dim => {
      const dimensionVal = getDimensionCategoryValue(dim, dataRow);
      return appStore.hardFilters[dim]?.includes(dimensionVal);
    })
  )
};

const { ridgeLines } = useHistogramLines(data, () => appStore.dimensions, getDimensionCategoryValue, dimensionOptionLabel);

// TODO: (vimc-9191) order the plot rows by the mean of means.
// Only 'relevant' lines may be displayed, but not all relevant lines will be displayed, depending on soft filters.
// These relevant lines are used to populate the color legend, which is used to control the soft filters.
const relevantLines = computed(() => {
  // Only check plot rows for relevancy if each row represents a disease.
  if (appStore.dimensions[Axes.ROW] !== Dimensions.DISEASE || appStore.dimensions[Axes.WITHIN_BAND] !== Dimensions.LOCATION) {
    return ridgeLines.value;
  };

  return ridgeLines.value.filter((line) => {
    // If data for a disease is not present at the same geographical resolution as the focus, we should consider the disease irrelevant.
    // E.g. Say the focus value is 'Djibouti', a location. If for some row of ridgelines - where rows are diseases, such as Malaria -
    // there is no line for Djibouti, we should exclude the Malaria row so that we only display rows that are relevant for Djibouti.
    const disease = line.metadata?.[Axes.ROW];
    const locationsForDisease = ridgeLines.value
      .filter(l => l.metadata?.[Axes.ROW] === disease)
      .map(({ metadata }) => metadata?.withinBand);
    return appStore.focus.every(f => locationsForDisease.includes(f));
  });
})

// Apply soft filter over the hard and relevancy filters to determine which lines are actually displayed.
const softFilteredLines = computed(() => {
  return relevantLines.value.filter(line => {
    return [Axes.COLUMN, Axes.ROW, Axes.WITHIN_BAND].every(ax => {
      const axVal = line.metadata?.[ax];
      const dim = appStore.dimensions[ax];
      return !axVal || !dim || appStore.softFilters[dim]?.includes(axVal);
    });
  });
});

// Debounce chart updates so that there is no flickering if filters change at a different moment from focus/dimensions.
const updateChart = debounce(() => {
  if (relevantLines.value.length === 0 || !chartWrapper.value) {
    return;
  }

  if (softFilteredLines.value.length === 0) {
    chartWrapper.value.innerHTML = "<p class='m-auto'>No data available for the selected filters.</p>";
    return;
  }

  colorStore.setColors(relevantLines.value);

  softFilteredLines.value.forEach(line => {
    // TODO: Once we have implemented ordering the categories, ensure that this ordering is reflected in
    // the color assignment, since the palettes maximize contrast between _neighboring_ colors.
    const {
      fillColor,
      fillOpacity: defaultFillOpacity,
      strokeColor,
      strokeOpacity: defaultStrokeOpacity,
    } = colorStore.getColorsForLine(line.metadata!);

    const isHovered = appStore.hoveredValue && line.metadata?.[colorStore.colorAxis] === appStore.hoveredValue;
    const anotherIsHovered = appStore.hoveredValue && !isHovered;

    const fillOpacity = isHovered ? 0.5 : anotherIsHovered ? 0.2 : defaultFillOpacity;
    const strokeOpacity = anotherIsHovered ? 0.2 : defaultStrokeOpacity;

    line.style = {
      fillOpacity: fillOpacity,
      fillColor: isHovered ? strokeColor : fillColor,
      strokeWidth: 1,
      opacity: strokeOpacity,
      strokeColor,
    };
  });

  const minX = Math.min(...softFilteredLines.value.flatMap(l => l.points![0]?.x ?? 0));
  const maxX = Math.max(...softFilteredLines.value.flatMap(l => l.points[l.points.length - 1]!.x));
  const maxY = Math.max(...softFilteredLines.value.flatMap(l => Math.max(...l.points.map(p => p.y))));

  const numericalScales = {
    x: { start: appStore.logScaleEnabled ? minX : 0, end: maxX },
    y: { start: 0, end: maxY },
  };

  const xCategoricalScale = softFilteredLines.value.map(l => l.bands?.x).filter(c => !!c) as string[];
  // TODO: Implement an ordering for the row categories, depending on the mean of means.
  const yCategoricalScale = softFilteredLines.value.map(l => l.bands?.y).filter(c => !!c) as string[];
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
    .addTraces(softFilteredLines.value)
    .addArea()
    .addGridLines({ x: !appStore.dimensions[Axes.COLUMN], y: false })
    // .addTooltips() // TODO: Enable tooltips once behaviour is satisfactory for area charts (vimc-8117)
    .makeResponsive()

  if (Object.values(categoricalScales).length !== 2) {
    chart.addZoom();
  }

  chart.appendTo(chartWrapper.value, numericalScales, {}, categoricalScales);
}, 100);

watch([softFilteredLines, () => appStore.focus, () => appStore.hoveredValue, chartWrapper], updateChart, { immediate: true });
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

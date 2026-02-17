<template>
  <div
    v-if="colors && colors.length >= 2"
    class="h-20 flex"
    id="colorLegend"
  >
    <ul class="flex flex-col gap-y-1 flex-wrap max-h-full min-h-0">
      <li
        v-for="({ value, color, hidden, label }) in colors"
        :key="value"
        class="flex gap-x-2 text-sm mr-15"
      >
        <button
          type="button"
          class="legend-button flex gap-x-2 cursor-pointer"
          :class="{ 'filtered-by-legend': hidden }"
          :data-testid="`${value}Button`"
          :aria-label="`Toggle ${label ?? value}, currently ${hidden ? 'hidden' : 'visible'}`"
          @click="handleClick(value)"
        >
          <div class="flex gap-x-2 items-center text-sm">
            <span
              class="legend-color-box"
              :style="colorBoxStyle(color)"
            />
            <span class="legend-label">
              {{ label ?? value }}
            </span>
          </div>
          <span
            class="text-xs text-gray-500 ms-auto remove-button"
            :class="{ invisible: hidden }"
          >
            &times;
          </span>
        </button>
      </li>
      <li v-if="legendSelections?.length !== filter?.length">
        <FwbButton
          color="light"
          id="resetLegendSelectionsButton"
          class="cursor-pointer"
          size="sm"
          @click="appStore.resetLegendSelections"
        >
          Reset filters
        </FwbButton>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type HEX } from "color-convert";
import { FwbButton } from 'flowbite-vue'
import { useColorStore } from '@/stores/colorStore';
import { dimensionOptionLabel } from '@/utils/options';
import { useAppStore } from '@/stores/appStore';
import { Axis, Dimension } from '@/types';
import { margins } from '@/utils/plotConfiguration';
import { compareLocResolution } from '@/utils/compareLocResolution';

const appStore = useAppStore();
const colorStore = useColorStore();

const filter = computed(() => appStore.filters[colorStore.colorDimension]);
const legendSelections = computed(() => appStore.legendSelections[colorStore.colorDimension]);

const colors = computed(() => {
  const { colorDimension } = colorStore;
  let colorsMap: [string, string][] = [];
  if (colorDimension === appStore.dimensions[Axis.WITHIN_BAND] && colorDimension === Dimension.LOCATION) {
    colorsMap = Array.from(colorStore.colorMapping).toSorted(([aLocation], [bLocation]) => {
      const [aLocRes, bLocRes] = [aLocation, bLocation].map(appStore.geographicalResolutionForLocation);
      return compareLocResolution(aLocRes, bLocRes);
    });
  } else {
    // Maintain the order of colors as in the plot-rows; the plot rows start from the bottom, so we reverse.
    colorsMap = Array.from(colorStore.colorMapping).toReversed();
  }

  // Add more values to the map, denoting:
  // hidden: whether it is included in the legend filters at the time of calculation.
  // label: the human-readable label to use with this color (depends on the current value of colorDimension).
  return colorsMap.map(([value, color]) => ({
    value,
    color,
    hidden: !legendSelections.value?.includes(value),
    label: dimensionOptionLabel(colorStore.colorDimension, value),
  }));
})

const handleClick = (value: string) => {
  if (legendSelections.value?.includes(value)) {
    appStore.legendSelections[colorStore.colorDimension] = legendSelections.value.filter(v => v !== value);
  } else {
    appStore.legendSelections[colorStore.colorDimension]?.push(value);
  }
}

const colorBoxStyle = (color: HEX) => {
  const { fillColor, strokeColor } = colorStore.colorProperties(color);
  return {
    backgroundColor: fillColor,
    borderColor: strokeColor,
  }
}
</script>

<style scoped>
.legend-color-box {
  width: 1rem;
  height: 1rem;
  display: inline-block;
  border-style: solid;
}

.legend-label {
  line-height: 1rem;
  margin-top: 1px;
  word-wrap: normal;
}

.legend-button {
  &.filtered-by-legend {
    text-decoration: line-through;
    text-decoration-color: gray;

    &:not(:hover) {
      color: var(--color-gray-500);

      .legend-color-box {
        background-color: var(--color-gray-200) !important;
      }
    }

    &:hover {
      color: var(--color-gray-800);
    }
  }

  &:not(.filtered-by-legend) {
    &:hover {
      opacity: 0.75;

      .remove-button {
        color: red;
      }
    }

    .legend-color-box {
      border-width: 2px;
    }
  }
}

li:last-of-type {
  margin-bottom: 0.5rem;
}
</style>
